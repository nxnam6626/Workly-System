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

  /** 
   * Đăng ký Bước 1: Khởi tạo yêu cầu đăng ký (Gửi link qua email).
   */
  async register(dto: RegisterDto) {
    return this.securityService.createRegistrationRequest(dto);
  }

  /**
   * Đăng ký Bước 2: Hoàn tất đăng ký sau khi người dùng nhấn vào link email.
   */
  async processRegistrationLink(token: string) {
    // 1. Lấy dữ liệu từ Redis
    const dto = await this.securityService.finalizeRegistration(token);

    // 2. Kiểm tra lại xem có ai đăng ký email này trong lúc chờ chưa
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      // Check if user already has requested role
      const roles = existingUser.userRoles.map((ur: any) => ur.role.roleName);
      if (roles.includes(dto.role)) {
        throw new ConflictException(
          `Email này đã được đăng ký với vai trò ${dto.role}.`,
        );
      }
    }

    // 3. Hash mật khẩu và Tạo User trong database
    const hashedPassword = await this.securityService.hashPassword(dto.password);
    
    // Vì User đã vào CSDL ở bước này là mặc định đã verified (do bấm link) 
    // ta trỏ params options passwordAlreadyHashed = true
    const newUser = await this.usersService.create(
      { ...dto, password: hashedPassword },
      { passwordAlreadyHashed: true },
    );

    return {
      message: 'Đăng ký tài khoản thành công! Bây giờ bạn có thể đăng nhập.',
      user: {
        userId: newUser.userId,
        email: dto.email,
        fullName: 'fullName' in dto ? dto.fullName : 'Người dùng',
        role: dto.role,
      }
    };
  }


  /** Lệnh bí mật tạo Supreme Admin trên Database Production. */
  async setupAdmin() {
    const email = 'admin@workly.com';
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      return { message: 'Tài khoản Supreme Admin đã tồn tại trên Môi trường này.', email };
    }

    const prisma = (this.usersService as any).prisma; // Sử dụng Prisma instance hiện tại đã an toàn IPv4
    
    // Đảm bảo có role ADMIN và CANDIDATE
    for (const roleName of ['CANDIDATE', 'RECRUITER', 'ADMIN']) {
      await prisma.role.upsert({ where: { roleName }, update: {}, create: { roleName } });
    }

    const adminRole = await prisma.role.findUnique({ where: { roleName: 'ADMIN' } });
    const candidateRole = await prisma.role.findUnique({ where: { roleName: 'CANDIDATE' } });

    const password = await this.securityService.hashPassword('123456');

    await prisma.user.create({
      data: {
        email,
        password,
        status: 'ACTIVE',
        userRoles: {
          create: [{ roleId: adminRole.roleId }],
        },
        admin: { create: { adminLevel: 1 } },
      },
    });

    return { message: '✅ Đã khởi tạo thành công tài khoản Supreme Admin!', email, password: 'Đã thiết lập thành 123456' };
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
        roles: roles,
        candidate: user.candidate,
        recruiter: user.recruiter,
        admin: user.admin,
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
