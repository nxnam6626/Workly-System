import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../auth/decorators/roles.decorator';
import type { StatusUser } from '../../generated/prisma';

import { MailService } from '../../mail/mail.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private searchService: SearchService,
  ) {}

  /** Tạo user (dùng cho đăng ký hoặc admin tạo). passwordAlreadyHashed = true khi gọi từ Auth (đã hash). */
  async create(
    data: CreateUserDto | RegisterDto,
    options?: { passwordAlreadyHashed?: boolean },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) throw new ConflictException('Email đã tồn tại!');

    const hashedPassword =
      options?.passwordAlreadyHashed === true
        ? data.password
        : await bcrypt.hash(data.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });

      // Find or connect to the role
      const roleRecord = await tx.role.upsert({
        where: { roleName: data.role },
        update: {},
        create: { roleName: data.role },
      });

      // Create UserRole link
      await tx.userRole.create({
        data: {
          userId: newUser.userId,
          roleId: roleRecord.roleId,
        },
      });

      if (data.role === 'CANDIDATE') {
        await tx.candidate.create({
          data: {
            userId: newUser.userId,
            fullName: data.fullName,
            phone: '',
          },
        });
      } else if (data.role === 'RECRUITER') {
        await tx.recruiter.create({
          data: { userId: newUser.userId },
        });
      } else if (data.role === 'ADMIN') {
        await tx.admin.create({
          data: {
            userId: newUser.userId,
            adminLevel: 1,
          },
        });
      }

      return { message: 'Tạo user thành công', userId: newUser.userId };
    });

    let displayName = data.email.split('@')[0];
    if ('fullName' in data && data.fullName) displayName = data.fullName;

    // Fire and forget integration events
    this.mailService.sendWelcomeEmail(data.email, displayName).catch(console.error);
    this.searchService.indexUser({ 
      id: result.userId, 
      email: data.email, 
      roles: [data.role as string] 
    }).catch(console.error);

    return result;
  }

  /** Thêm vai trò mới cho user đã tồn tại (Multi-role). */
  async addRoleToUser(userId: string, data: RegisterDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      // Find or connect to the role
      const roleRecord = await tx.role.upsert({
        where: { roleName: data.role },
        update: {},
        create: { roleName: data.role },
      });

      // Create UserRole link
      await tx.userRole.create({
        data: {
          userId,
          roleId: roleRecord.roleId,
        },
      });

      if (data.role === 'CANDIDATE') {
        const existingCandidate = await tx.candidate.findUnique({ where: { userId } });
        if (!existingCandidate) {
          await tx.candidate.create({
            data: {
              userId,
              fullName: (data as any).fullName || 'Người dùng',
              phone: '',
            },
          });
        }
      } else if (data.role === 'RECRUITER') {
        const existingRecruiter = await tx.recruiter.findUnique({ where: { userId } });
        if (!existingRecruiter) {
          await tx.recruiter.create({
            data: { userId },
          });
        }
      } else if (data.role === 'ADMIN') {
        const existingAdmin = await tx.admin.findUnique({ where: { userId } });
        if (!existingAdmin) {
          await tx.admin.create({
            data: {
              userId,
              adminLevel: 1,
            },
          });
        }
      }

      return { message: 'Đăng ký thêm vai trò thành công', userId };
    });

    try {
      const user = await this.findOne(userId);
      const roles = user.userRoles.map((ur: any) => ur.role.roleName);
      await this.searchService.indexUser({ 
        id: user.userId, 
        email: user.email, 
        roles 
      });
    } catch (error) {
      console.error(error);
    }

    return result;
  }

  /** Xử lý login từ OAuth (Google/LinkedIn): Tìm User bằng Email hoặc tạo mới Role CANDIDATE. */
  async findOrCreateOAuthUser(data: { email: string; provider: any; providerId: string; fullName: string; avatar?: string }) {
    let user = await this.findByEmail(data.email);
    if (!user) {
      // Create new CANDIDATE user without password
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            provider: data.provider,
            providerId: data.providerId,
            avatar: data.avatar,
            status: 'ACTIVE',
          },
          include: {
            candidate: true,
            recruiter: true,
            userRoles: { include: { role: true } },
          },
        });

        const roleRecord = await tx.role.upsert({
          where: { roleName: 'CANDIDATE' },
          update: {},
          create: { roleName: 'CANDIDATE' },
        });

        await tx.userRole.create({
          data: {
            userId: newUser.userId,
            roleId: roleRecord.roleId,
          },
        });

        await tx.candidate.create({
          data: {
            userId: newUser.userId,
            fullName: data.fullName,
            phone: '',
          },
        });

        return tx.user.findUnique({
          where: { userId: newUser.userId },
          include: {
            candidate: true,
            recruiter: true,
            userRoles: { include: { role: true } },
          },
        }) as any;
      });

      // Fire and forget integration events
      this.mailService.sendWelcomeEmail(data.email, data.fullName).catch(console.error);
      if (user) {
        this.searchService.indexUser({ 
          id: user.userId, 
          email: data.email, 
          roles: ['CANDIDATE'] 
        }).catch(console.error);
      }
    } else {
      // If user exists but no provider, update the provider
      const anyUser = user as any;
      if (!anyUser.provider || anyUser.provider === 'LOCAL') {
        user = await this.prisma.user.update({
          where: { userId: user.userId },
          data: {
            provider: data.provider,
            providerId: data.providerId,
            ...(data.avatar && !user.avatar ? { avatar: data.avatar } : {}),
          },
          include: {
            candidate: true,
            recruiter: true,
            userRoles: { include: { role: true } },
          },
        }) as any;
      }
    }
    return user;
  }

  /** Đăng ký (gọi từ Auth sau khi đã hash mật khẩu). */
  async register(data: RegisterDto) {
    return this.create(data, { passwordAlreadyHashed: true });
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    role?: Role;
    status?: StatusUser;
  }) {
    const { skip = 0, take = 20, role, status } = params ?? {};
    const where: any = {};
    if (role) {
      where.userRoles = {
        some: {
          role: {
            roleName: role,
          },
        },
      };
    }
    if (status) where.status = status;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          userId: true,
          email: true,
          status: true,
          phoneNumber: true,
          avatar: true,
          isEmailVerified: true,
          createdAt: true,
          lastLogin: true,
          userRoles: {
            include: { role: true },
          },
          candidate: { select: { fullName: true, phone: true } },
          recruiter: { select: { position: true, bio: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, skip, take };
  }

  async findOne(userId: string) {
    if (!userId) throw new NotFoundException('ID user không hợp lệ.');
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        status: true,
        phoneNumber: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        userRoles: {
          include: { role: true },
        },
        candidate: true,
        recruiter: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    return user;
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        candidate: true,
        recruiter: true,
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async update(userId: string, dto: UpdateUserDto) {
    await this.findOne(userId);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { userId } },
      });
      if (existing) throw new ConflictException('Email đã tồn tại!');
    }

    const updateData: any = {
      ...(dto.email && { email: dto.email }),
      ...(dto.password && { password: await bcrypt.hash(dto.password, 10) }),
      ...(dto.status && { status: dto.status }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { userId },
        data: updateData,
      });

      if (dto.role) {
        const roleRecord = await tx.role.upsert({
          where: { roleName: dto.role },
          update: {},
          create: { roleName: dto.role },
        });

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId,
              roleId: roleRecord.roleId,
            },
          },
          update: {},
          create: {
            userId,
            roleId: roleRecord.roleId,
          },
        });
      }
    });

    if (dto.fullName) {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        include: { candidate: true },
      });
      if (user?.candidate) {
        await this.prisma.candidate.update({
          where: { candidateId: user.candidate.candidateId },
          data: { fullName: dto.fullName },
        });
      }
    }

    return this.findOne(userId);
  }

  async remove(userId: string) {
    await this.findOne(userId);
    await this.prisma.user.delete({ where: { userId } });
    return { message: 'Đã xóa user.' };
  }

  async setRefreshToken(userId: string, refreshToken: string | null) {
    return this.prisma.user.update({
      where: { userId },
      data: { refreshToken },
    });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({
      where: { userId },
      data: { lastLogin: new Date() },
    });
  }
}
