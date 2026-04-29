import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../../mail/mail.service';
import { SearchService } from '../../search/search.service';
import { CompaniesService } from '../../companies/companies.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { RegisterDto } from '../../auth/dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserCreationService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private searchService: SearchService,
    private companiesService: CompaniesService,
  ) { }

  async create(
    data: CreateUserDto | RegisterDto,
    options?: { passwordAlreadyHashed?: boolean },
  ) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { userRoles: { include: { role: true } } },
    });

    if (existingUser) {
      const hasRole = existingUser.userRoles.some(
        (ur) => ur.role.roleName === data.role,
      );
      if (hasRole) {
        throw new ConflictException(`Email này đã được đăng ký với vai trò ${data.role}.`);
      }
      return this.addRoleToUser(existingUser.userId, data as RegisterDto);
    }

    const hashedPassword = options?.passwordAlreadyHashed === true
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

      const roleRecord = await tx.role.upsert({
        where: { roleName: data.role },
        update: {},
        create: { roleName: data.role },
      });
      await tx.userRole.create({
        data: { userId: newUser.userId, roleId: roleRecord.roleId },
      });

      if (data.role === 'CANDIDATE') {
        await tx.candidate.create({
          data: {
            userId: newUser.userId,
            fullName: 'fullName' in data && data.fullName ? data.fullName : 'Người dùng',
          },
        });
      } else if (data.role === 'RECRUITER') {
        const companyId = await this.companiesService.findOrCreateCompanyFromTaxCode(tx, {
          companyName: (data as any).companyName,
          taxCode: (data as any).taxCode,
          websiteUrl: (data as any).websiteUrl,
          verifyStatus: (data as any).verifyStatus,
        });

        await tx.recruiter.create({
          data: {
            userId: newUser.userId,
            fullName: 'fullName' in data && data.fullName ? data.fullName : 'Nhà tuyển dụng',
            ...(companyId ? { companyId } : {}),
          },
        });
      } else if (data.role === 'ADMIN') {
        const permissions = 'permissions' in data ? (data as any).permissions : [];
        const isSupreme = permissions?.includes('ALL') || permissions?.includes('SUPER_ADMIN');
        await tx.admin.create({
          data: {
            userId: newUser.userId,
            fullName: 'fullName' in data && data.fullName ? data.fullName : 'Quản trị viên',
            permissions: isSupreme ? ['SUPER_ADMIN'] : permissions || [],
          },
        });
      }

      return { message: 'Tạo user thành công', userId: newUser.userId };
    });

    const displayName = ('fullName' in data && data.fullName) ? data.fullName : data.email.split('@')[0];
    this.mailService.sendWelcomeEmail(data.email, displayName).catch(console.error);
    this.searchService.indexUser({ id: result.userId, email: data.email, roles: [data.role as string] }).catch(console.error);

    return result;
  }

  async findOrCreateOAuthUser(data: {
    email: string;
    provider: any;
    providerId: string;
    fullName: string;
    avatar?: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { candidate: true, recruiter: true, admin: true, userRoles: { include: { role: true } } },
    });

    if (!user) {
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: data.email,
            provider: data.provider,
            providerId: data.providerId,
            avatar: data.avatar,
            status: 'ACTIVE',
          },
        });

        const roleRecord = await tx.role.upsert({
          where: { roleName: 'CANDIDATE' },
          update: {},
          create: { roleName: 'CANDIDATE' },
        });

        await tx.userRole.create({
          data: { userId: newUser.userId, roleId: roleRecord.roleId },
        });

        await tx.candidate.create({
          data: { userId: newUser.userId, fullName: data.fullName },
        });

        return tx.user.findUnique({
          where: { userId: newUser.userId },
          include: { candidate: true, recruiter: true, admin: true, userRoles: { include: { role: true } } },
        }) as any;
      });

      this.mailService.sendWelcomeEmail(data.email, data.fullName).catch(console.error);
      if (user) {
        this.searchService.indexUser({ id: user.userId, email: data.email, roles: ['CANDIDATE'] }).catch(console.error);
      }
    } else {
      if (!user.provider || user.provider === 'LOCAL') {
        user = (await this.prisma.user.update({
          where: { userId: user.userId },
          data: {
            provider: data.provider,
            providerId: data.providerId,
            ...(data.avatar && !user.avatar ? { avatar: data.avatar } : {}),
          },
          include: { candidate: true, recruiter: true, admin: true, userRoles: { include: { role: true } } },
        })) as any;
      }
    }
    return user;
  }

  async addRoleToUser(userId: string, data: RegisterDto) {
    const result = await this.prisma.$transaction(async (tx) => {
      const roleRecord = await tx.role.upsert({
        where: { roleName: data.role },
        update: {},
        create: { roleName: data.role },
      });

      await tx.userRole.create({
        data: { userId, roleId: roleRecord.roleId },
      });

      if (data.role === 'CANDIDATE') {
        const existing = await tx.candidate.findUnique({ where: { userId } });
        if (!existing) {
          await tx.candidate.create({
            data: { userId, fullName: (data as any).fullName || 'Người dùng' },
          });
        }
      } else if (data.role === 'RECRUITER') {
        const existing = await tx.recruiter.findUnique({ where: { userId } });
        if (!existing) {
          const companyId = await this.companiesService.findOrCreateCompanyFromTaxCode(tx, {
            companyName: (data as any).companyName,
            taxCode: (data as any).taxCode,
          });
          await tx.recruiter.create({
            data: { userId, fullName: (data as any).fullName || 'Nhà tuyển dụng', ...(companyId ? { companyId } : {}) },
          });
        }
      } else if (data.role === 'ADMIN') {
        const existing = await tx.admin.findUnique({ where: { userId } });
        if (!existing) {
          await tx.admin.create({
            data: { userId, fullName: (data as any).fullName || 'Quản trị viên', permissions: ['SUPER_ADMIN'] },
          });
        }
      }
      return { message: 'Đăng ký thêm vai trò thành công', userId };
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { userId },
        include: { userRoles: { include: { role: true } } },
      });
      if (user) {
        this.searchService.indexUser({
          id: user.userId,
          email: user.email,
          roles: user.userRoles.map((ur) => ur.role.roleName),
        }).catch(console.error);
      }
    } catch (e) { }

    return result;
  }
}
