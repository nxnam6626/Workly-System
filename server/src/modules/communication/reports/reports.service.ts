import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async reportCandidate(recruiterId: string, candidateId: string, dto: any) {
    // Optional: check if recruiter had an application with this candidate
    if (dto.applicationId) {
      const app = await this.prisma.application.findUnique({
        where: { applicationId: dto.applicationId },
        include: { jobPosting: true },
      });
      if (!app || app.jobPosting.recruiterId !== recruiterId) {
        throw new ForbiddenException(
          'Bạn không có quyền báo cáo ứng viên này cho đơn ứng tuyển này.',
        );
      }
    }

    const report = await this.prisma.candidateReport.create({
      data: {
        recruiterId,
        candidateId,
        applicationId: dto.applicationId,
        reason: dto.reason,
        content: dto.content,
      },
    });

    // Handle consequences if reason is severe
    if (dto.reason === 'NO_SHOW' || dto.reason === 'SABOTAGE') {
      await this.prisma.user.updateMany({
        where: { candidate: { candidateId } },
        data: { violations: { increment: 1 } },
      });
    }

    // Real-time update for the dashboard
    this.notificationsService.emitToUser(recruiterId, 'dashboard.sync', {
      type: 'CANDIDATE_REPORTED',
      candidateId,
      applicationId: dto.applicationId,
    });

    return report;
  }

  async findAll() {
    return this.prisma.candidateReport.findMany({
      include: {
        recruiter: true,
        candidate: true,
        application: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
