import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

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
    const isMatch = await this.comparePassword(password, user.password);
    if (!isMatch) return null;
    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }

  /** Đăng ký: hash mật khẩu rồi gọi UsersService.create. */
  async register(dto: RegisterDto) {
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
    const tokens = await this.issueTokens(user.userId, user.email, user.role);
    await this.usersService.setRefreshToken(user.userId, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        candidate: user.candidate,
        recruiter: user.recruiter,
      },
    };
  }

  /** Đăng xuất: xóa refresh token trong DB. */
  async logout(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
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
    const stored = await this.usersService.findByEmail(user.email);
    if (!stored?.refreshToken || stored.refreshToken !== refreshToken)
      throw new UnauthorizedException('Refresh token đã bị thu hồi.');
    const tokens = await this.issueTokens(user.userId, user.email, user.role);
    await this.usersService.setRefreshToken(user.userId, tokens.refreshToken);
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    };
  }

  /** Kiểm tra access token và trả về payload (user info). */
  async validateToken(accessToken: string) {
    if (!accessToken)
      throw new BadRequestException('Access token không được để trống.');
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
    return { valid: true, user };
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessSecret = process.env.JWT_ACCESS_SECRET ?? 'access-secret';
    const refreshSecret = process.env.JWT_REFRESH_SECRET ?? 'refresh-secret';
    const accessExpiresSec = 900; // 15 phút
    const refreshExpiresSec = 604800; // 7 ngày

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email, role, type: 'access' } as object,
        { secret: accessSecret, expiresIn: accessExpiresSec },
      ),
      this.jwtService.signAsync(
        { sub: userId, email, role, type: 'refresh' } as object,
        { secret: refreshSecret, expiresIn: refreshExpiresSec },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
