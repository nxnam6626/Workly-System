import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';

@Injectable()
export class CompanyReviewsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(candidateId: string, companyId: string, applicationId: string, dto: any) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { jobPosting: true },
    });

    if (!application || application.candidateId !== candidateId || application.jobPosting.companyId !== companyId) {
      throw new ForbiddenException('Bạn không có quyền đánh giá buổi phỏng vấn này.');
    }

    const allowedStatuses = ['INTERVIEWING', 'ACCEPTED', 'REJECTED', 'INTERVIEW_CONFIRMED'];
    if (!allowedStatuses.includes(application.appStatus)) {
      throw new ForbiddenException('Bạn chỉ có thể đánh giá sau khi đã tham gia phỏng vấn.');
    }

    const existingReview = await this.prisma.companyReview.findUnique({
      where: { applicationId },
    });
    if (existingReview) {
      throw new ForbiddenException('Bạn đã đánh giá buổi phỏng vấn này rồi.');
    }

    const review = await this.prisma.companyReview.create({
      data: {
        candidateId,
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
      companyId
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCompanyStats(companyId: string) {
    const reviews = await this.prisma.companyReview.findMany({
      where: { companyId, status: 'PUBLISHED' },
    });

    if (reviews.length === 0) return {
      count: 0,
      avgProcess: 0,
      avgInterviewer: 0,
      avgOffice: 0,
      avgTotal: 0,
    };

    const count = reviews.length;
    const avgProcess = reviews.reduce((s, r) => s + r.ratingProcess, 0) / count;
    const avgInterviewer = reviews.reduce((s, r) => s + r.ratingInterviewer, 0) / count;
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
}
