import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class SecurityService {
  constructor(
    private usersService: UsersService,
    private redisService: RedisService,
    private mailService: MailService,
  ) {}

  // ==========================================
  // PASSWORD MANAGEMENT
  // ==========================================

  /** Mã hóa mật khẩu. */
  async hashPassword(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 10);
  }

  /** So sánh mật khẩu plain với hash. */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /** Đổi mật khẩu: người dùng đã đăng nhập xác nhận mật khẩu cũ rồi đặt mới. */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const userWithPwd = await this.usersService.findOneWithPassword(userId);
    if (!userWithPwd || !userWithPwd.password)
      throw new BadRequestException(
        'Tài khoản này đăng nhập qua mạng xã hội và chưa có mật khẩu. Vui lòng dùng tính năng Quên mật khẩu để thiết lập.',
      );

    const isMatch = await this.comparePassword(
      currentPassword,
      userWithPwd.password,
    );
    if (!isMatch)
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');

    await this.usersService.update(userId, { password: newPassword });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  /** Quên mật khẩu: Tạo OTP 6 số lưu vào Redis và gửi mail. */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Luôn trả về thành công chung chung để tránh lộ email
    if (!user)
      return { message: 'Nếu email tồn tại, một mã xác nhận đã được gửi!' };

    // Tạo OTP 6 chữ số
    const token = crypto.randomInt(100000, 999999).toString();
    const redisKey = `reset_token:${dto.email}`;

    // Lưu vào Redis (15 phút = 900 giây)
    await this.redisService.set(redisKey, token, 900);

    // Gửi email
    await this.mailService.sendPasswordResetEmail(dto.email, token);

    return { message: 'Nếu email tồn tại, một mã xác nhận đã được gửi!' };
  }

  /** Đặt lại mật khẩu: Trùng khớp OTP, đổi mật khẩu và xóa token / phiên cũ. */
  async resetPassword(dto: ResetPasswordDto) {
    const redisKey = `reset_token:${dto.email}`;
    const storedToken = await this.redisService.get(redisKey);

    if (!storedToken || storedToken !== dto.token) {
      throw new BadRequestException(
        'Mã xác nhận không hợp lệ hoặc đã hết hạn.',
      );
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Lỗi tài khoản không tồn tại.');

    await this.usersService.update(user.userId, { password: dto.newPassword });

    // Hủy OTP trên Redis
    await this.redisService.del(redisKey);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // ==========================================
  // REGISTRATION LINK (XÁC MINH LINK)
  // ==========================================

  /**
   * Tạo một yêu cầu đăng ký, lưu thông tin vào Redis và gửi link xác minh.
   */
  async createRegistrationRequest(dto: any) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      // Allow if the user exists but is registering for a new role
      const roles = existingUser.userRoles.map((ur: any) => ur.role.roleName);
      if (roles.includes(dto.role)) {
        throw new ConflictException(
          `Email này đã được đăng ký với vai trò ${dto.role}.`,
        );
      }
    }

    // Tạo token ngẫu nhiên (64 ký tự hex)
    const token = crypto.randomBytes(32).toString('hex');
    const redisKey = `registration_request:${token}`;

    // Lưu toàn bộ RegisterDto vào Redis (24 giờ = 86400 giây)
    await this.redisService.set(redisKey, JSON.stringify(dto), 86400);

    // Gửi email chứa đường dẫn xác minh (tùy chọn mẫu theo role)
    if (dto.role === 'RECRUITER') {
      await this.mailService.sendRecruiterRegistrationLink(dto.email, token);
    } else {
      await this.mailService.sendRegistrationLink(dto.email, token);
    }

    return { message: 'Đường dẫn xác minh đã được gửi đến email của bạn.' };
  }

  /**
   * Xác thực token và lấy dữ liệu đăng ký từ Redis.
   */
  async finalizeRegistration(token: string) {
    const redisKey = `registration_request:${token}`;
    const storedData = await this.redisService.get(redisKey);

    if (!storedData) {
      throw new BadRequestException('Đường dẫn xác minh không hợp lệ hoặc đã hết hạn.');
    }

    try {
      const dto = JSON.parse(storedData);
      
      // Xóa yêu cầu khỏi Redis sau khi lấy thành công
      await this.redisService.del(redisKey);
      
      return dto;
    } catch (e) {
      throw new BadRequestException('Dữ liệu xác minh bị lỗi. Vui lòng đăng ký lại.');
    }
  }
}
