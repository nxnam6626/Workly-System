import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserDataService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: any) {
    const { skip = 0, take = 20, role, status, search } = params ?? {};
    const where: any = {};
    if (role) where.userRoles = { some: { role: { roleName: role } } };
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
          userRoles: { include: { role: true } },
          candidate: { select: { fullName: true } },
          recruiter: {
            select: {
              fullName: true,
              companyRole: true,
              position: true,
              bio: true,
              violationCount: true,
              recruiterSubscription: true,
              company: { include: { wallet: true } },
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
        userRoles: { include: { role: true } },
        candidate: true,
        recruiter: {
          include: { recruiterSubscription: true, company: { include: { wallet: true } } },
        },
        admin: { select: { permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');

    // Sync subscription for MEMBER
    if (user.recruiter && user.recruiter.companyRole === 'MEMBER' && user.recruiter.companyId) {
      const masterRecruiter = await this.prisma.recruiter.findFirst({
        where: { companyId: user.recruiter.companyId, companyRole: 'MASTER' },
        include: { recruiterSubscription: true },
      });
      if (masterRecruiter && masterRecruiter.recruiterSubscription) {
        user.recruiter.recruiterSubscription = masterRecruiter.recruiterSubscription;
      }
    }

    return user;
  }

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
          select: {
            candidateId: true,
            fullName: true,
            university: true,
            major: true,
            gpa: true,
            summary: true,
            desiredJob: true,
            isOpenToWork: true,
            gender: true,
            birthYear: true,
            location: true,
            totalYearsExp: true,
            currentSalary: true,
            degree: true,
            industries: true,
            languages: true,
            softSkills: true,
            interests: true,
            skills: true,
            experiences: { orderBy: { duration: 'desc' } },
            projects: true,
            certifications: true,
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
        recruiter: {
          include: { recruiterSubscription: true, company: { include: { wallet: true } } },
        },
        admin: { select: { permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');

    // Sync subscription for MEMBER
    if (user.recruiter && user.recruiter.companyRole === 'MEMBER' && user.recruiter.companyId) {
      const masterRecruiter = await this.prisma.recruiter.findFirst({
        where: { companyId: user.recruiter.companyId, companyRole: 'MASTER' },
        include: { recruiterSubscription: true },
      });
      if (masterRecruiter && masterRecruiter.recruiterSubscription) {
        user.recruiter.recruiterSubscription = masterRecruiter.recruiterSubscription;
      }
    }

    return user;
  }
}
