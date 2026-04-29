import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { NotificationsService } from '../../../notifications/notifications.service';
import { JobAlertsService } from '../../../job-alerts/job-alerts.service';
import { MessagesGateway } from '../../../messages/messages.gateway';

@Injectable()
export class JobNotificationService {
  private readonly logger = new Logger(JobNotificationService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private jobAlertsService: JobAlertsService,
    private messagesGateway: MessagesGateway,
  ) { }

  async triggerJobNotifications(job: any) {
    try {
      const alerts = await this.jobAlertsService.findAllAlerts();
      const matchedAlerts = alerts.filter((alert) =>
        job.title.toLowerCase().includes(alert.keywords.toLowerCase()),
      );

      for (const alert of matchedAlerts) {
        await this.notificationsService.create(
          alert.userId,
          'Việc làm mới theo từ khóa của bạn',
          `Có 1 việc làm mới theo từ khóa tìm kiếm "${alert.keywords}". Vào xem ngay`,
          'info',
        );
      }
    } catch (error) {
      this.logger.error('Error triggering job alerts notifications:', error);
    }
  }

  async pushUrgentNotifications(job: any) {
    try {
      const activeCandidates = await this.prisma.candidate.findMany({
        take: 10, // Limit to recent candidates for performance
      });
      for (const c of activeCandidates) {
        if (c.userId) {
          await this.notificationsService.create(
            c.userId,
            '🔥 Cơ hội việc làm Tuyển Gấp!',
            `Công ty ${job.company?.companyName || 'đối tác'} đang tuyển gấp vị trí "${job.title}". Hãy apply ngay!`,
            'info',
            `/jobs/${job.jobPostingId}`,
          );
          this.messagesGateway.server
            .to(`user_${c.userId}`)
            .emit('notification', {
              title: '🔥 Cơ hội việc làm Tuyển Gấp!',
              message: `Công ty ${job.company?.companyName || 'đối tác'} đang tuyển gấp vị trí "${job.title}". Hãy apply ngay!`,
              type: 'info',
              link: `/jobs/${job.jobPostingId}`,
            });
        }
      }
    } catch (e) {
      this.logger.error('Lỗi khi push urgent notifications:', e);
    }
  }

  async sendStatusNotification(userId: string, title: string, message: string, type: string, link: string) {
    await this.notificationsService.create(userId, title, message, type as any, link);
    this.messagesGateway.server.to(`user_${userId}`).emit('notification', {
      title,
      message,
      type,
      link,
    });
  }
}
