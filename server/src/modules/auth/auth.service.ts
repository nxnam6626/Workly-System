import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RedisService } from '../../redis/redis.service';
import { MailService } from '../../mail/mail.service';
import * as crypto from 'crypto';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private mailService: MailService,
  ) { }

  /** Mã hóa mật khẩu (dùng cho đăng ký / đổi mật khẩu). */
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

  /** Xác thực user theo email + password (dùng cho LocalStrategy). */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (!user.password) return null; // Protect against social login accounts without passwords
    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) return null;
    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  /** Đăng ký: Kiểm tra email, xác thực mật khẩu (nếu đã tồn tại), hash mật khẩu (nếu mới) rồi gọi UsersService. */
  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      if (!existingUser.password) {
        throw new BadRequestException('Email này được đăng ký qua Google/LinkedIn. Vui lòng đăng nhập qua đó.');
      }
      const isMatch = await this.comparePassword(dto.password, existingUser.password);
      if (!isMatch) {
        throw new ConflictException('Email đã tồn tại. Vui lòng nhập đúng mật khẩu nếu bạn muốn đăng ký thêm vai trò cho tài khoản này.');
      }
      const hasRole = existingUser.userRoles.some((ur: any) => ur.role.roleName === dto.role);
      if (hasRole) {
        throw new ConflictException(`Bạn đã đăng ký với vai trò ${dto.role} rồi. Vui lòng đăng nhập.`);
      }
      
      return this.usersService.addRoleToUser(existingUser.userId, dto);
    }

    const hashedPassword = await this.hashPassword(dto.password);
    return this.usersService.create(
      { ...dto, password: hashedPassword },
      { passwordAlreadyHashed: true },
    );
  }

  /** Đăng nhập: trả về access token + refresh token, lưu refresh vào DB. */
  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user)
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng.');
    await this.usersService.updateLastLogin(user.userId);
    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    const tokens = await this.issueTokens(user.userId, user.email, roles);
    await this.usersService.setRefreshToken(user.userId, tokens.refreshToken);
    await this.redisService.set(`refresh_token:${user.userId}`, tokens.refreshToken, 604800); // 7 days

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
      user: {
        userId: user.userId,
        email: user.email,
        roles: roles,
        candidate: user.candidate,
        recruiter: user.recruiter,
      },
    };
  }

  /** Đăng nhập hoặc đăng ký bằng OAuth: sinh token từ Auth provider profile. */
  async oauthLogin(profile: any) {
    const user = await this.usersService.findOrCreateOAuthUser({
      email: profile.email,
      provider: profile.provider,
      providerId: profile.providerId,
      fullName: profile.fullName || 'Người dùng mới',
      avatar: profile.avatar,
    });

    if (!user) {
      throw new UnauthorizedException('Không thể xác thực người dùng qua OAuth.');
    }

    await this.usersService.updateLastLogin(user.userId);
    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    const tokens = await this.issueTokens(user.userId, user.email, roles);
    await this.usersService.setRefreshToken(user.userId, tokens.refreshToken);
    await this.redisService.set(`refresh_token:${user.userId}`, tokens.refreshToken, 604800); // 7 days

    return tokens;
  }

  /** Đăng xuất: xóa refresh token trong DB và Redis. */
  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    await this.redisService.del(`refresh_token:${userId}`);
    return { message: 'Đã đăng xuất.' };
  }

  /** Làm mới token: kiểm tra refresh token, cấp cặp token mới. */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken)
      throw new BadRequestException('Refresh token không hợp lệ.');
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET ?? 'refresh-secret',
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn.',
      );
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Token không phải refresh token.');
    const user = await this.usersService.findOne(payload.sub);

    let storedToken = await this.redisService.get(`refresh_token:${user.userId}`);
    if (!storedToken) {
      const stored = await this.usersService.findByEmail(user.email);
      storedToken = stored?.refreshToken || null;
    }

    if (!storedToken || storedToken !== refreshToken)
      throw new UnauthorizedException('Refresh token đã bị thu hồi.');
    
    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    const tokens = await this.issueTokens(user.userId, user.email, roles);
    await this.usersService.setRefreshToken(user.userId, tokens.refreshToken);
    await this.redisService.set(`refresh_token:${user.userId}`, tokens.refreshToken, 604800);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    };
  }

  /** Kiểm tra access token và trả về payload (user info). */
  async validateToken(accessToken: string) {
    if (!accessToken)
      throw new UnauthorizedException('Access token không được để trống.');
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(accessToken, {
        secret: process.env.JWT_ACCESS_SECRET ?? 'access-secret',
      });
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn.');
    }
    if (payload.type !== 'access')
      throw new UnauthorizedException('Token không phải access token.');
    const user = await this.usersService.findOne(payload.sub);
    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    
    return { 
      valid: true, 
      user: {
        userId: user.userId,
        email: user.email,
        roles: roles,
        candidate: user.candidate,
        recruiter: user.recruiter,
      }
    };
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

    // Cập nhật mật khẩu mới thông qua usersService.update
    await this.usersService.update(user.userId, { password: dto.newPassword });

    // Hủy OTP trên Redis
    await this.redisService.del(redisKey);

    // Thu hồi toàn bộ Refresh Token cũ trong DB & Redis để bảo mật session
    await this.usersService.setRefreshToken(user.userId, null);
    await this.redisService.del(`refresh_token:${user.userId}`);

    return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' };
  }

  private async issueTokens(
    userId: string,
    email: string,
    roles: string[],
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'access-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret';
    const accessExpiresSec = 900; // 15 phút
    const refreshExpiresSec = 604800; // 7 ngày

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, roles, type: 'access' } as object,
        { secret: accessSecret, expiresIn: accessExpiresSec },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, roles, type: 'refresh' } as object,
        { secret: refreshSecret, expiresIn: refreshExpiresSec },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
