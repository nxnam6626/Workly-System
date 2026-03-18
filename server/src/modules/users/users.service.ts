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
import type { Role, StatusUser } from '../../generated/prisma';
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
          role: data.role,
          status: 'ACTIVE',
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
      }

      return { message: 'Tạo user thành công', userId: newUser.userId };
    });

    let displayName = data.email.split('@')[0];
    if ('fullName' in data && data.fullName) displayName = data.fullName;

    // Fire and forget integration events
    this.mailService.sendWelcomeEmail(data.email, displayName).catch(console.error);
    this.searchService.indexUser({ id: result.userId, email: data.email, role: data.role }).catch(console.error);

    return result;
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
    const where: { role?: Role; status?: StatusUser } = {};
    if (role) where.role = role;
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
          role: true,
          status: true,
          phoneNumber: true,
          avatar: true,
          isEmailVerified: true,
          createdAt: true,
          lastLogin: true,
          candidate: { select: { fullName: true, phone: true } },
          recruiter: { select: { position: true, bio: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data: users, total, skip, take };
  }

  async findOne(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        role: true,
        status: true,
        phoneNumber: true,
        avatar: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        candidate: true,
        recruiter: true,
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { candidate: true, recruiter: true },
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

    const updateData: {
      email?: string;
      password?: string;
      status?: StatusUser;
      phoneNumber?: string;
      avatar?: string;
      role?: Role;
    } = {
      ...(dto.email && { email: dto.email }),
      ...(dto.password && { password: await bcrypt.hash(dto.password, 10) }),
      ...(dto.status && { status: dto.status }),
      ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber }),
      ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      ...(dto.role && { role: dto.role }),
    };

    await this.prisma.user.update({
      where: { userId },
      data: updateData,
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
