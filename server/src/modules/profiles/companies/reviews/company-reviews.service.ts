import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';

@Injectable()
export class CompanyReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    userId: string,
    companyId: string,
    applicationId: string,
    dto: any,
  ) {
    // Profanity Filter
    const BAD_WORDS = [
      'ngu',
      'địt',
      'lồn',
      'cặc',
      'đĩ',
      'phò',
      'chó',
      'dốt',
      'mẹ mày',
      'thằng chó',
      'đm',
      'vcl',
      'đcm',
      'vãi lồn',
      'cc',
      'ncc',
      'vl',
      'đụ',
      'cl',
      'đéo',
    ];
    const contentLower = dto.content.toLowerCase();

    // Check for exact word matches using regex to avoid matching substrings like "người" for "ngu"
    for (const badWord of BAD_WORDS) {
      const regex = new RegExp(`\\b${badWord}\\b`, 'i');
      if (regex.test(contentLower)) {
        throw new BadRequestException(
          'Nội dung đánh giá chứa từ ngữ không phù hợp hoặc xúc phạm. Vui lòng chỉnh sửa lại.',
        );
      }
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new ForbiddenException('Bạn phải là ứng viên để đánh giá.');
    }

    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { jobPosting: true },
    });

    console.log('DEBUG REVIEW:', {
      appExists: !!application,
      appCandidateId: application?.candidateId,
      userCandidateId: candidate.candidateId,
      appCompanyId: application?.jobPosting?.companyId,
      passedCompanyId: companyId,
    });

    if (
      !application ||
      application.candidateId !== candidate.candidateId ||
      application.jobPosting.companyId !== companyId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền đánh giá buổi phỏng vấn này.',
      );
    }

    const allowedStatuses = [
      'INTERVIEWING',
      'ACCEPTED',
      'REJECTED',
      'INTERVIEW_CONFIRMED',
    ];
    if (!allowedStatuses.includes(application.appStatus)) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá sau khi đã tham gia phỏng vấn.',
      );
    }

    const existingReview = await this.prisma.companyReview.findUnique({
      where: { applicationId },
    });
    if (existingReview) {
      throw new ForbiddenException('Bạn đã đánh giá buổi phỏng vấn này rồi.');
    }

    const review = await this.prisma.companyReview.create({
      data: {
        candidateId: candidate.candidateId,
        companyId,
        applicationId,
        ratingProcess: dto.ratingProcess,
        ratingInterviewer: dto.ratingInterviewer,
        ratingOffice: dto.ratingOffice,
        content: dto.content,
        isAnonymous: dto.isAnonymous,
      },
    });

    // Real-time update for the company profile page
    this.notificationsService.emitToCompany(companyId, 'company.sync', {
      type: 'NEW_REVIEW',
      companyId,
    });

    return review;
  }

  async findByCompany(companyId: string) {
    return this.prisma.companyReview.findMany({
      where: { companyId, status: 'PUBLISHED' },
      include: {
        candidate: {
          select: {
            fullName: true,
            user: { select: { avatar: true } },
          },
        },
        application: {
          include: {
            jobPosting: {
              select: { title: true, jobPostingId: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanyStats(companyId: string) {
    const reviews = await this.prisma.companyReview.findMany({
      where: { companyId, status: 'PUBLISHED' },
    });

    if (reviews.length === 0)
      return {
        count: 0,
        avgProcess: 0,
        avgInterviewer: 0,
        avgOffice: 0,
        avgTotal: 0,
      };

    const count = reviews.length;
    const avgProcess = reviews.reduce((s, r) => s + r.ratingProcess, 0) / count;
    const avgInterviewer =
      reviews.reduce((s, r) => s + r.ratingInterviewer, 0) / count;
    const avgOffice = reviews.reduce((s, r) => s + r.ratingOffice, 0) / count;
    const avgTotal = (avgProcess + avgInterviewer + avgOffice) / 3;

    return {
      count,
      avgProcess: Math.round(avgProcess * 10) / 10,
      avgInterviewer: Math.round(avgInterviewer * 10) / 10,
      avgOffice: Math.round(avgOffice * 10) / 10,
      avgTotal: Math.round(avgTotal * 10) / 10,
    };
  }

  // Admin APIs
  async findAllAdmin(
    page: number = 1,
    limit: number = 10,
    status?: string,
    searchTerm?: string,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (searchTerm) {
      where.OR = [
        {
          company: {
            companyName: { contains: searchTerm, mode: 'insensitive' },
          },
        },
        { content: { contains: searchTerm, mode: 'insensitive' } },
        {
          candidate: {
            fullName: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.companyReview.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: { companyId: true, companyName: true, logo: true },
          },
          candidate: {
            select: {
              candidateId: true,
              fullName: true,
              user: { select: { email: true } },
            },
          },
          application: {
            include: {
              jobPosting: {
                select: { title: true },
              },
            },
          },
        },
      }),
      this.prisma.companyReview.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateStatusAdmin(reviewId: string, status: string) {
    return this.prisma.companyReview.update({
      where: { reviewId },
      data: { status },
      include: {
        company: { select: { companyId: true, companyName: true } },
      },
    });
  }

  async deleteAdmin(reviewId: string) {
    return this.prisma.companyReview.delete({
      where: { reviewId },
    });
  }
}
