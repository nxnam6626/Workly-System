import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../../redis/redis.service';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  /** Tạo bộ đôi Access Token và Refresh Token. */
  async issueTokens(
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

    // Save refresh token to DB and Redis for rotation/revocation
    await this.usersService.setRefreshToken(userId, refreshToken);
    await this.redisService.set(
      `refresh_token:${userId}`,
      refreshToken,
      604800,
    ); // 7 days

    return { accessToken, refreshToken };
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
    if (!user) throw new UnauthorizedException('Người dùng không tồn tại.');

    if (user.status === 'LOCKED') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.',
      );
    }

    // Check if refreshToken matches the one stored in Redis (or DB)
    let storedToken = await this.redisService.get(
      `refresh_token:${user.userId}`,
    );
    if (!storedToken) {
      const dbUser = await this.usersService.findByEmail(user.email);
      storedToken = dbUser?.refreshToken || null;
    }

    if (!storedToken || storedToken !== refreshToken)
      throw new UnauthorizedException('Refresh token đã bị thu hồi.');

    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    const tokens = await this.issueTokens(user.userId, user.email, roles);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
    };
  }

  /** Kiểm tra access token và trả về thông tin user. */
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
        isEmailVerified: user.isEmailVerified,
        roles: roles,
        candidate: user.candidate,
        recruiter: user.recruiter,
      },
    };
  }

  /** Thu hồi token khi đăng xuất. */
  async revokeToken(userId: string) {
    await this.usersService.setRefreshToken(userId, null);
    await this.redisService.del(`refresh_token:${userId}`);
  }
}
