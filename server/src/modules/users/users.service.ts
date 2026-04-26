import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../auth/decorators/roles.decorator';
import type { StatusUser } from '@/generated/prisma';

import { MailService } from '../../mail/mail.service';
import { SearchService } from '../search/search.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private searchService: SearchService,
    private moduleRef: ModuleRef,
    private readonly supabaseService: SupabaseService,
    private readonly aiService: AiService,
  ) {}

  // ==========================================
  // INGESTION & OAUTH (Nhóm Khởi tạo & OAuth)
  // ==========================================

  /** Tạo user (dùng cho đăng ký hoặc admin tạo). passwordAlreadyHashed = true khi gọi từ Auth (đã hash). */
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
        throw new ConflictException(
          `Email này đã được đăng ký với vai trò ${data.role}.`,
        );
      }
      return this.addRoleToUser(existingUser.userId, data as RegisterDto);
    }

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

      // Find or connect to the primary requested role
      const primaryRoleRecord = await tx.role.upsert({
        where: { roleName: data.role },
        update: {},
        create: { roleName: data.role },
      });
      await tx.userRole.create({
        data: { userId: newUser.userId, roleId: primaryRoleRecord.roleId },
      });

      // Create profiles based on requested role
      if (data.role === 'CANDIDATE') {
        await tx.candidate.create({
          data: {
            userId: newUser.userId,
            fullName:
              'fullName' in data && data.fullName
                ? data.fullName
                : 'Người dùng',
          },
        });
      }

      if (data.role === 'RECRUITER') {
        let companyId: string | null = null;
        if ('companyName' in data && data.companyName) {
          let existingCompany: any = null;
          if ('taxCode' in data && data.taxCode) {
            existingCompany = await tx.company.findFirst({
              where: { taxCode: data.taxCode },
            });
          }
          if (existingCompany) {
            companyId = existingCompany.companyId;
          } else {
            let companyDataFromApi: any = null;
            if ('taxCode' in data && data.taxCode) {
              try {
                const res = await fetch(
                  `https://esgoo.net/api-mst/${data.taxCode}.htm`,
                );
                const apiData = await res.json();
                if (apiData.error === 0 && apiData.data) {
                  companyDataFromApi = apiData.data;
                }
              } catch (e) {
                console.error('Failed to fetch tax code data', e);
              }
            }

            const newCompany = await tx.company.create({
              data: {
                companyName: companyDataFromApi?.ten || data.companyName,
                taxCode:
                  'taxCode' in data && data.taxCode ? data.taxCode : null,
                address: companyDataFromApi?.dc || null,
                websiteUrl:
                  'websiteUrl' in data && data.websiteUrl
                    ? data.websiteUrl
                    : null,
                taxAddress: companyDataFromApi?.dc || null,
                status: companyDataFromApi?.tinhtrang || null,
                internationalName:
                  companyDataFromApi?.internationalName || null,
                shortName: companyDataFromApi?.shortName || null,
                verifyStatus:
                  companyDataFromApi ||
                  ('verifyStatus' in data && data.verifyStatus)
                    ? 1
                    : 0,
                branches: {
                  create: {
                    name: 'Trụ sở chính',
                    address: companyDataFromApi?.dc || 'Đang cập nhật',
                    isVerified: !!companyDataFromApi,
                  },
                },
              },
            });
            companyId = newCompany.companyId;
          }
        }

        await tx.recruiter.create({
          data: {
            userId: newUser.userId,
            fullName: 'fullName' in data && data.fullName ? data.fullName : 'Nhà tuyển dụng',
            ...(companyId ? { companyId } : {}),
          },
        });
      } else if (data.role === 'ADMIN') {
        const permissions = 'permissions' in data ? data.permissions : [];
        const isSupreme = permissions?.includes('ALL') || permissions?.includes('SUPER_ADMIN');
        await tx.admin.create({
          // Removed legacy field
          data: {
            userId: newUser.userId,
            fullName: 'fullName' in data && data.fullName ? data.fullName : 'Quản trị viên',
            permissions: isSupreme ? ['SUPER_ADMIN'] : permissions || [],
          },
        });
      }

      return { message: 'Tạo user thành công', userId: newUser.userId };
    });

    let displayName = data.email.split('@')[0];
    if ('fullName' in data && data.fullName) displayName = data.fullName;

    // Fire and forget integration events
    this.mailService
      .sendWelcomeEmail(data.email, displayName)
      .catch(console.error);
    this.searchService
      .indexUser({
        id: result.userId,
        email: data.email,
        roles: [data.role as string],
      })
      .catch(console.error);

    return result;
  }

  /** Đăng ký (gọi từ Auth sau khi đã hash mật khẩu). */
  async register(data: RegisterDto) {
    return this.create(data, { passwordAlreadyHashed: true });
  }

  /** Xử lý login từ OAuth (Google/LinkedIn): Tìm User bằng Email hoặc tạo mới Role CANDIDATE. */
  async findOrCreateOAuthUser(data: {
    email: string;
    provider: any;
    providerId: string;
    fullName: string;
    avatar?: string;
  }) {
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
      this.mailService
        .sendWelcomeEmail(data.email, data.fullName)
        .catch(console.error);
      if (user) {
        this.searchService
          .indexUser({
            id: user.userId,
            email: data.email,
            roles: ['CANDIDATE'],
          })
          .catch(console.error);
      }
    } else {
      // If user exists but no provider, update the provider
      const anyUser = user as any;
      if (!anyUser.provider || anyUser.provider === 'LOCAL') {
        user = (await this.prisma.user.update({
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
        })) as any;
      }
    }
    return user;
  }

  // ==========================================
  // DATA RETRIEVAL (Nhóm Truy vấn dữ liệu)
  // ==========================================

  async findAll(params?: {
    skip?: number;
    take?: number;
    role?: Role;
    status?: StatusUser;
    search?: string;
  }) {
    const { skip = 0, take = 20, role, status, search } = params ?? {};
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
    if (search) where.email = { contains: search, mode: 'insensitive' };

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
          violations: true,
          phoneNumber: true,
          avatar: true,
          createdAt: true,
          lastLogin: true,
          userRoles: {
            include: { role: true },
          },
          candidate: { select: { fullName: true } },
          recruiter: {
            select: {
              position: true,
              bio: true,
              violationCount: true,
              recruiterSubscription: true,
              recruiterWallet: true,
            },
          },
          admin: { select: { permissions: true } },
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
        violations: true,
        phoneNumber: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        userRoles: {
          include: { role: true },
        },
        candidate: true,
        recruiter: {
          include: { recruiterSubscription: true, recruiterWallet: true },
        },
        admin: { select: { permissions: true } },
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
        admin: { select: { permissions: true } },
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  async findOneWithPassword(userId: string) {
    return this.prisma.user.findUnique({
      where: { userId },
      include: {
        candidate: true,
        recruiter: true,
        admin: { select: { permissions: true } },
        userRoles: {
          include: { role: true },
        },
      },
    });
  }

  /** Lấy thông tin user hiện tại (dùng cho /users/me). */
  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        email: true,
        status: true,
        phoneNumber: true,
        avatar: true,
        createdAt: true,
        lastLogin: true,
        provider: true,
        userRoles: { include: { role: true } },
        candidate: {
          include: {
            skills: true,
            cvs: {
              select: {
                cvId: true,
                cvTitle: true,
                fileUrl: true,
                isMain: true,
                createdAt: true,
                parsedData: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        recruiter: true,
        admin: { select: { permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    return user;
  }

  // ==========================================
  // UPDATE & ROLES (Nhóm Cập nhật & Vai trò)
  // ==========================================

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
        // Delete all existing roles for this user
        await tx.userRole.deleteMany({
          where: { userId },
        });

        // Add the new primary role
        const roleRecord = await tx.role.upsert({
          where: { roleName: dto.role },
          update: {},
          create: { roleName: dto.role },
        });

        await tx.userRole.create({
          data: {
            userId,
            roleId: roleRecord.roleId,
          },
        });

        // Ensure profile exists for the new role if Admin/Recruiter
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

  /** Cập nhật ảnh đại diện của user (có kiểm duyệt AI Vision). */
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    const roles = user.userRoles?.map((ur) => ur.role.roleName) || [];
    const isCandidateOnly =
      roles.includes('CANDIDATE') &&
      !roles.includes('RECRUITER') &&
      !roles.includes('ADMIN');

    // 1. Upload ảnh mới lên Supabase
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const path = `avatars/${userId}/${fileName}`;

    const avatarUrl = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    // 2. Kiểm duyệt ảnh bằng Gemini Vision (fail-open nếu AI không khả dụng)
    const expectedType = isCandidateOnly ? 'face_only' : 'face_or_logo';
    const modResult = await this.aiService.moderateImage(
      avatarUrl,
      file.mimetype,
      expectedType,
    );
    if (!modResult.safe) {
      // Xóa ảnh vừa upload khỏi Supabase (đảm bảo không để lại rác)
      const uploadedPath = this.supabaseService.extractPathFromUrl(avatarUrl);
      if (uploadedPath)
        await this.supabaseService.deleteFile(uploadedPath).catch(() => {});
      throw new BadRequestException(
        `Ảnh không phù hợp: ${modResult.reason}. Vui lòng chọn ảnh khác.`,
      );
    }

    // 3. Cập nhật URL vào DB
    await this.prisma.user.update({
      where: { userId },
      data: { avatar: avatarUrl },
    });

    // 4. Dọn dẹp ảnh cũ nếu có trên Supabase
    if (user.avatar) {
      const oldPath = this.supabaseService.extractPathFromUrl(user.avatar);
      if (oldPath) {
        try {
          await this.supabaseService.deleteFile(oldPath);
        } catch (e) {
          console.error('[UsersService] Failed to delete old avatar:', e);
        }
      }
    }

    return { avatarUrl };
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
        const existingCandidate = await tx.candidate.findUnique({
          where: { userId },
        });
        if (!existingCandidate) {
          await tx.candidate.create({
            data: {
              userId,
              fullName: (data as any).fullName || 'Người dùng',
            },
          });
        }
      } else if (data.role === 'RECRUITER') {
        const existingRecruiter = await tx.recruiter.findUnique({
          where: { userId },
        });
        if (!existingRecruiter) {
          let companyId: string | null = null;
          if ('companyName' in data && data.companyName) {
            let existingCompany: any = null;
            if ('taxCode' in data && data.taxCode) {
              existingCompany = await tx.company.findFirst({
                where: { taxCode: data.taxCode },
              });
            }
            if (existingCompany) {
              companyId = existingCompany.companyId;
            } else {
              let companyDataFromApi: any = null;
              if ('taxCode' in data && data.taxCode) {
                try {
                  const res = await fetch(
                    `https://esgoo.net/api-mst/${data.taxCode}.htm`,
                  );
                  const apiData = await res.json();
                  if (apiData.error === 0 && apiData.data) {
                    companyDataFromApi = apiData.data;
                  }
                } catch (e) {
                  console.error('Failed to fetch tax code data', e);
                }
              }

              const newCompany = await tx.company.create({
                data: {
                  companyName: companyDataFromApi?.ten || data.companyName,
                  taxCode:
                    'taxCode' in data && data.taxCode ? data.taxCode : null,
                  address: companyDataFromApi?.dc || null,
                  websiteUrl:
                    'websiteUrl' in data && data.websiteUrl
                      ? data.websiteUrl
                      : null,
                  taxAddress: companyDataFromApi?.dc || null,
                  status: companyDataFromApi?.tinhtrang || null,
                  internationalName:
                    companyDataFromApi?.internationalName || null,
                  shortName: companyDataFromApi?.shortName || null,
                  verifyStatus:
                    companyDataFromApi ||
                    ('verifyStatus' in data && data.verifyStatus)
                      ? 1
                      : 0,
                  branches: {
                    create: {
                      name: 'Trụ sở chính',
                      address: companyDataFromApi?.dc || 'Đang cập nhật',
                      isVerified: !!companyDataFromApi,
                    },
                  },
                },
              });
              companyId = newCompany.companyId;
            }
          }

          await tx.recruiter.create({
            data: {
              userId,
              fullName: (data as any).fullName || 'Nhà tuyển dụng',
              ...(companyId ? { companyId } : {}),
            },
          });
        }
      } else if (data.role === 'ADMIN') {
        const existingAdmin = await tx.admin.findUnique({ where: { userId } });
        if (!existingAdmin) {
          await tx.admin.create({
            data: {
              userId,
              fullName: (data as any).fullName || 'Quản trị viên',
              permissions: ['SUPER_ADMIN'],
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
        roles,
      });
    } catch (error) {
      console.error(error);
    }

    return result;
  }

  /** Cập nhật thông tin hồ sơ ứng viên (fullName, phone, university, major, gpa, skills, isOpenToWork). */
  async updateCandidateProfile(
    userId: string,
    dto: {
      fullName: string;
      phone: string;
      university?: string;
      major?: string;
      gpa?: number;
      skills?: { skillName: string; level: string }[];
      isOpenToWork?: boolean;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true },
    });
    if (!user || !user.candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    }

    const candidateId = user.candidate.candidateId;

    await this.prisma.$transaction(async (tx) => {
      // Update Candidate core fields
      await tx.candidate.update({
        where: { candidateId },
        data: {
          fullName: dto.fullName,
          university: dto.university ?? null,
          major: dto.major ?? null,
          gpa: dto.gpa ?? null,
          ...(dto.isOpenToWork !== undefined && {
            isOpenToWork: dto.isOpenToWork,
          }),
        },
      });

      // Update User.phoneNumber directly
      await tx.user.update({
        where: { userId },
        data: { phoneNumber: dto.phone },
      });

      // Replace skills atomically (now with levels)
      if (dto.skills !== undefined) {
        await tx.skill.deleteMany({ where: { candidateId } });
        if (dto.skills.length > 0) {
          await tx.skill.createMany({
            data: dto.skills.map((s) => ({
              skillName: s.skillName,
              level: (s.level as any) || 'BEGINNER',
              candidateId,
            })),
          });
        }
      }
    });

    return this.getMe(userId);
  }

  // ==========================================
  // ADMIN & MODERATION (Nhóm Quản trị & Xóa)
  // ==========================================

  async lockUser(userId: string, reqUserId?: string) {
    if (userId === reqUserId) {
      throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình.');
    }
    
    const userToLock = await this.findOne(userId);
    if (userToLock.email === 'admin@workly.com') {
      throw new BadRequestException('Không thể khóa tài khoản Quản trị viên tối cao.');
    }

    await this.prisma.user.update({
      where: { userId },
      data: { status: 'LOCKED' },
    });

    try {
      const gateway = this.moduleRef.get(MessagesGateway, { strict: false });
      if (gateway) {
        gateway.server.to(`user_${userId}`).emit('accountLocked');
      }
    } catch (error: any) {
      console.error('Could not get MessagesGateway:', error.message);
    }

    return { message: 'Tài khoản đã bị khóa.' };
  }

  async unlockUser(userId: string) {
    await this.findOne(userId);
    await this.resetViolationCount(userId);
    await this.prisma.user.update({
      where: { userId },
      data: { status: 'ACTIVE', accountLevel: 'NORMAL' },
    });
    return { message: 'Tài khoản đã được mở khóa và reset số lần vi phạm.' };
  }

  async unlockWithProbation(userId: string) {
    await this.findOne(userId);
    await this.resetViolationCount(userId);
    await this.prisma.user.update({
      where: { userId },
      data: { status: 'ACTIVE', accountLevel: 'PROBATION' },
    });
    return { message: 'Đã mở khóa tài khoản và đưa vào danh sách Thử thách (Reset vi phạm).' };
  }

  async banUser(userId: string) {
    const user = await this.findOne(userId);
    if (user.email === 'admin@workly.com') {
      throw new BadRequestException('Không thể ban tài khoản Quản trị viên tối cao.');
    }
    
    await this.prisma.user.update({
      where: { userId },
      data: { status: 'BANNED' },
    });
    return { message: 'Đã cấm vĩnh viễn tài khoản người dùng.' };
  }

  async resetViolationCount(userId: string) {
    const user = await this.findOne(userId);
    
    await this.prisma.$transaction(async (tx) => {
      // Reset global chat violations
      await tx.user.update({
        where: { userId },
        data: { violations: 0 },
      });

      // Reset recruiter specific violations if they exist
      if (user.recruiter) {
        await tx.recruiter.update({
          where: { userId },
          data: { violationCount: 0 },
        });
      }
    });

    return { message: 'Đã đặt lại toàn bộ số lần vi phạm về 0.' };
  }

  async remove(userId: string, reqUserId?: string) {
    if (userId === reqUserId) {
      throw new BadRequestException('Bạn không thể tự xóa tài khoản của chính mình.');
    }

    const userToDelete = await this.findOne(userId);
    if (userToDelete.email === 'admin@workly.com') {
      throw new BadRequestException('Không thể xóa tài khoản Quản trị viên tối cao.');
    }

    await this.prisma.user.delete({ where: { userId } });
    return { message: 'Đã xóa user.' };
  }

  // ==========================================
  // SECURITY UTILS (Nhóm Tiện ích bảo mật)
  // ==========================================

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

  async updateAdminPermissions(userId: string, permissions: string[], fullName?: string) {
    const user = await this.findOne(userId);
    if (!user.admin) {
      throw new NotFoundException(
        'Người dùng này không phải là quản trị viên.',
      );
    }
    const isSupreme = permissions.includes('ALL') || permissions.includes('SUPER_ADMIN');
    await this.prisma.admin.update({
      where: { userId },
      data: {
        permissions: isSupreme ? ['SUPER_ADMIN'] : permissions,
        ...(fullName && { fullName }),
      },
    });

    return { message: 'Đã cập nhật quyền hạn quản trị viên.' };
  }
}
// Trigger restart 2
