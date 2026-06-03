import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class UserDataService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: any) {
    const {
      skip = 0,
      take = 20,
      role,
      status,
      search,
      hasPendingVerification,
    } = params ?? {};
    const where: any = {};
    if (role) where.userRoles = { some: { role: { roleName: role } } };
    if (status) where.status = status;
    if (search) {
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          search,
        );
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { candidate: { fullName: { contains: search, mode: 'insensitive' } } },
        { recruiter: { fullName: { contains: search, mode: 'insensitive' } } },
        { admin: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
      if (isUuid) {
        where.OR.push({ userId: search });
      }
    }
    if (hasPendingVerification === 'true' || hasPendingVerification === true) {
      where.candidate = {
        OR: [
          { degrees: { some: { status: 'PENDING' } } },
          { certifications: { some: { status: 'PENDING' } } },
        ],
      };
    }

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
          candidate: {
            select: {
              fullName: true,
              candidateId: true,
              degrees: {
                where: { status: 'PENDING' },
                select: { degreeId: true },
              },
              certifications: {
                where: { status: 'PENDING' },
                select: { certificationId: true },
              },
            },
          },
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
        candidate: {
          include: {
            degrees: true,
            certifications: true,
          },
        },
        recruiter: {
          include: {
            recruiterSubscription: true,
            company: { include: { wallet: true } },
          },
        },
        admin: { select: { permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');

    // Sync subscription for MEMBER
    if (
      user.recruiter &&
      user.recruiter.companyRole === 'MEMBER' &&
      user.recruiter.companyId
    ) {
      const masterRecruiter = await this.prisma.recruiter.findFirst({
        where: { companyId: user.recruiter.companyId, companyRole: 'MASTER' },
        include: { recruiterSubscription: true },
      });
      if (masterRecruiter && masterRecruiter.recruiterSubscription) {
        user.recruiter.recruiterSubscription =
          masterRecruiter.recruiterSubscription;
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
            jobSearchExpiresAt: true,
            gender: true,
            birthYear: true,
            location: true,
            totalYearsExp: true,
            currentSalary: true,
            degree: true,
            industries: true,
            languages: true,
            otherInfo: true,
            softSkills: true,
            interests: true,
            skills: true,
            experiences: { orderBy: { duration: 'desc' } },
            projects: true,
            certifications: true,
            degrees: true,
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
          include: {
            recruiterSubscription: true,
            company: { include: { wallet: true } },
          },
        },
        admin: { select: { permissions: true } },
      },
    });
    if (!user) throw new NotFoundException('Không tìm thấy user.');

    // Sync subscription for MEMBER
    if (
      user.recruiter &&
      user.recruiter.companyRole === 'MEMBER' &&
      user.recruiter.companyId
    ) {
      const masterRecruiter = await this.prisma.recruiter.findFirst({
        where: { companyId: user.recruiter.companyId, companyRole: 'MASTER' },
        include: { recruiterSubscription: true },
      });
      if (masterRecruiter && masterRecruiter.recruiterSubscription) {
        user.recruiter.recruiterSubscription =
          masterRecruiter.recruiterSubscription;
      }
    }

    return user;
  }
}
