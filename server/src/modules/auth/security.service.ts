import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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
  ) { }

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
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const userWithPwd = await this.usersService.findOneWithPassword(userId);
    if (!userWithPwd || !userWithPwd.password)
      throw new BadRequestException('Tài khoản này đăng nhập qua mạng xã hội và chưa có mật khẩu. Vui lòng dùng tính năng Quên mật khẩu để thiết lập.');

    const isMatch = await this.comparePassword(currentPassword, userWithPwd.password);
    if (!isMatch)
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng.');

    await this.usersService.update(userId, { password: newPassword });

    return { message: 'Đổi mật khẩu thành công.' };
  }

  /** Quên mật khẩu: Tạo OTP 6 số lưu vào Redis và gửi mail. */
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    // Luôn trả về thành công chung chung để tránh lộ email
    if (!user) return { message: 'Nếu email tồn tại, một mã xác nhận đã được gửi!' };

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
      throw new BadRequestException('Mã xác nhận không hợp lệ hoặc đã hết hạn.');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Lỗi tài khoản không tồn tại.');

    await this.usersService.update(user.userId, { password: dto.newPassword });

    // Hủy OTP trên Redis
    await this.redisService.del(redisKey);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  /** Gửi link/mã xác minh email: Tạo OTP 6 số lưu Redis và gửi mail. */
  async sendEmailVerification(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (user.isEmailVerified)
      throw new BadRequestException('Email của bạn đã được xác minh rồi.');

    const token = crypto.randomInt(100000, 999999).toString();
    const redisKey = `email_verification:${user.email}`;

    // Lưu vào Redis (15 phút)
    await this.redisService.set(redisKey, token, 900);

    // Gửi mail
    await this.mailService.sendVerificationEmail(user.email, token);

    return { message: 'Mã xác minh đã được gửi đến email của bạn.' };
  }

  /** Xác minh email: so khớp OTP từ người dùng. */
  async verifyEmail(dto: { email: string; token: string }) {
    const redisKey = `email_verification:${dto.email}`;
    const storedToken = await this.redisService.get(redisKey);

    if (!storedToken || storedToken !== dto.token) {
      throw new BadRequestException('Mã xác minh không hợp lệ hoặc đã hết hạn.');
    }

    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Tài khoản không tồn tại.');

    // Cập nhật trạng thái xác minh
    await this.usersService.update(user.userId, { isEmailVerified: true });

    // Hủy OTP trên Redis
    await this.redisService.del(redisKey);

    return { message: 'Xác minh email thành công!' };
  }
}
