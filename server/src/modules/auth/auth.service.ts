import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private securityService: SecurityService,
  ) {}

  // ==========================================
  // CORE AUTHENTICATION (Xác thực chính)
  // ==========================================

  /** Đăng ký: Kiểm tra email, xác thực mật khẩu (nếu đã tồn tại), hash mật khẩu (nếu mới) rồi gọi UsersService. */
  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      if (!existingUser.password) {
        throw new BadRequestException(
          'Email này được đăng ký qua Google/LinkedIn. Vui lòng đăng nhập qua đó.',
        );
      }
      const isMatch = await this.securityService.comparePassword(
        dto.password,
        existingUser.password,
      );
      if (!isMatch) {
        throw new ConflictException(
          'Email đã tồn tại. Vui lòng nhập đúng mật khẩu nếu bạn muốn đăng ký thêm vai trò cho tài khoản này.',
        );
      }
      const hasRole = existingUser.userRoles.some(
        (ur: any) => ur.role.roleName === dto.role,
      );
      if (hasRole) {
        throw new ConflictException(
          `Bạn đã đăng ký với vai trò ${dto.role} rồi. Vui lòng đăng nhập.`,
        );
      }

      return this.usersService.addRoleToUser(existingUser.userId, dto);
    }

    const hashedPassword = await this.securityService.hashPassword(
      dto.password,
    );
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
    const tokens = await this.tokenService.issueTokens(
      user.userId,
      user.email,
      roles,
    );

    return {
      ...tokens,
      expiresIn: process.env.JWT_ACCESS_EXPIRES ?? '15m',
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
      throw new UnauthorizedException(
        'Không thể xác thực người dùng qua OAuth.',
      );
    }

    if (user.status === 'LOCKED') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.',
      );
    }

    await this.usersService.updateLastLogin(user.userId);
    const roles = user.userRoles.map((ur: any) => ur.role.roleName);
    return this.tokenService.issueTokens(user.userId, user.email, roles);
  }

  /** Đăng xuất: xóa refresh token trong DB và Redis. */
  async logout(userId: string) {
    await this.tokenService.revokeToken(userId);
    return { message: 'Đã đăng xuất.' };
  }

  /** Xác thực user theo email + password (dùng cho LocalStrategy). */
  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;
    if (user.status === 'LOCKED')
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.',
      );
    if (!user.password) return null; // Protect against social login accounts without passwords

    const isMatch = await this.securityService.comparePassword(
      password,
      user.password,
    );
    if (!isMatch) return null;

    const { password: _, refreshToken: __, ...result } = user;
    return result;
  }
}
