import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserCreationService } from './services/user-creation.service';
import { CandidateProfileService } from './services/candidate-profile.service';
import { UserAvatarService } from './services/user-avatar.service';
import { UserModerationService } from './services/user-moderation.service';
import { UserDataService } from './services/user-data.service';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private userCreationService: UserCreationService,
    private candidateProfileService: CandidateProfileService,
    private userAvatarService: UserAvatarService,
    private moderationService: UserModerationService,
    private userDataService: UserDataService,
  ) { }

  // --- Registration & OAuth ---
  async create(data: any, options?: any) {
    return this.userCreationService.create(data, options);
  }

  async register(data: RegisterDto) {
    return this.userCreationService.create(data, { passwordAlreadyHashed: true });
  }

  async findOrCreateOAuthUser(data: any) {
    return this.userCreationService.findOrCreateOAuthUser(data);
  }

  async addRoleToUser(userId: string, data: RegisterDto) {
    return this.userCreationService.addRoleToUser(userId, data);
  }

  // --- Profile Management ---
  async updateCandidateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    return this.candidateProfileService.updateCandidateProfile(userId, dto);
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    return this.userAvatarService.updateAvatar(userId, file);
  }

  // --- Data Retrieval ---
  async findAll(params?: any) {
    return this.userDataService.findAll(params);
  }

  async findOne(userId: string) {
    return this.userDataService.findOne(userId);
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.prisma.user.findUnique({
      where: { email },
      include: { candidate: true, recruiter: true, admin: { select: { permissions: true } }, userRoles: { include: { role: true } } },
    });
  }

  async findOneWithPassword(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true, recruiter: true, admin: { select: { permissions: true } }, userRoles: { include: { role: true } } },
    });
  }

  async getMe(userId: string) {
    return this.userDataService.getMe(userId);
  }

  // --- Update ---
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
      await tx.user.update({ where: { userId }, data: updateData });

      if (dto.role) {
        await tx.userRole.deleteMany({ where: { userId } });
        const roleRecord = await tx.role.upsert({
          where: { roleName: dto.role },
          update: {},
          create: { roleName: dto.role },
        });
        await tx.userRole.create({ data: { userId, roleId: roleRecord.roleId } });

        if (dto.role === 'RECRUITER') {
          const ext = await tx.recruiter.findUnique({ where: { userId } });
          if (!ext) await tx.recruiter.create({ data: { userId } });
        } else if (dto.role === 'ADMIN') {
          const ext = await tx.admin.findUnique({ where: { userId } });
          if (!ext) await tx.admin.create({ data: { userId, permissions: ['SUPER_ADMIN'] } });
        }
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

  // --- Admin & Moderation ---
  async lockUser(userId: string, reqUserId?: string) {
    return this.moderationService.lockUser(userId, reqUserId);
  }

  async unlockUser(userId: string) {
    return this.moderationService.unlockUser(userId);
  }

  async unlockWithProbation(userId: string) {
    return this.moderationService.unlockWithProbation(userId);
  }

  async banUser(userId: string) {
    return this.moderationService.banUser(userId);
  }

  async resetViolationCount(userId: string) {
    return this.moderationService.resetViolationCount(userId);
  }

  async remove(userId: string, reqUserId?: string) {
    if (userId === reqUserId) throw new ConflictException('Bạn không thể tự xóa tài khoản của chính mình.');
    const user = await this.findOne(userId);
    if (user.email === 'admin@workly.com') throw new ConflictException('Không thể xóa tài khoản Quản trị viên tối cao.');
    await this.prisma.user.delete({ where: { userId } });
    return { message: 'Đã xóa user.' };
  }

  // --- Utils ---
  async setRefreshToken(userId: string, refreshToken: string | null) {
    return this.prisma.user.update({ where: { userId }, data: { refreshToken } });
  }

  async updateLastLogin(userId: string) {
    return this.prisma.user.update({ where: { userId }, data: { lastLogin: new Date() } });
  }

  async updateAdminPermissions(userId: string, permissions: string[], fullName?: string) {
    return this.moderationService.updateAdminPermissions(userId, permissions, fullName);
  }
}
