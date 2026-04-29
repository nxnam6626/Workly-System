import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MessagesGateway } from '../../messages/messages.gateway';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ApplicationInterviewService {
  private readonly logger = new Logger(ApplicationInterviewService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
  ) { }

  async findAvailableInterviewSlot(jobPostingId: string) {
    let scheduleDate = new Date();
    let daysUntilThu = (4 + 7 - scheduleDate.getDay()) % 7;

    if (daysUntilThu <= 2) {
      daysUntilThu += 7;
    }

    scheduleDate.setDate(scheduleDate.getDate() + daysUntilThu);
    scheduleDate.setHours(0, 0, 0, 0);

    const possibleSlots = ['08:00', '10:00', '14:00', '16:00'];
    let foundSlot = false;
    let autoInterviewDate: Date | null = null;
    let autoInterviewTime: string | null = null;

    while (!foundSlot) {
      const startOfDay = new Date(scheduleDate);
      const endOfDay = new Date(scheduleDate);
      endOfDay.setHours(23, 59, 59, 999);

      const scheduledApps = await this.prisma.application.findMany({
        where: {
          jobPostingId,
          appStatus: 'INTERVIEWING',
          interviewDate: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        select: { interviewTime: true }
      });

      const slotCounts: Record<string, number> = {};
      possibleSlots.forEach(s => slotCounts[s] = 0);
      scheduledApps.forEach(app => {
        if (app.interviewTime && slotCounts[app.interviewTime] !== undefined) {
          slotCounts[app.interviewTime]++;
        }
      });

      for (const slot of possibleSlots) {
        if (slotCounts[slot] < 5) {
          autoInterviewDate = new Date(scheduleDate);
          autoInterviewTime = slot;
          foundSlot = true;
          break;
        }
      }

      if (!foundSlot) {
        scheduleDate.setDate(scheduleDate.getDate() + 7);
      }
    }

    return { date: autoInterviewDate, time: autoInterviewTime };
  }

  @Cron('* * * * *')
  async checkPastInterviews() {
    try {
      const now = new Date();

      const interviewingApps = await this.prisma.application.findMany({
        where: {
          appStatus: 'INTERVIEWING',
          interviewDate: { not: null },
          interviewTime: { not: null }
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: true
        }
      });

      for (const app of interviewingApps) {
        if (!app.interviewDate || !app.interviewTime || !app.jobPosting.recruiter?.userId) continue;

        const [hours, minutes] = app.interviewTime.split(':').map(Number);
        const interviewDateTime = new Date(app.interviewDate);
        interviewDateTime.setHours(hours, minutes, 0, 0);

        interviewDateTime.setHours(interviewDateTime.getHours() + 2);

        if (now > interviewDateTime) {
          const recruiterId = app.jobPosting.recruiter.userId;
          const trackingLink = `/recruiter/applications?remind=${app.applicationId}`;

          const existingNotif = await this.prisma.notification.findFirst({
            where: {
              userId: recruiterId,
              link: trackingLink
            }
          });

          if (!existingNotif) {
            const title = 'Cập nhật kết quả phỏng vấn';
            const message = `Buổi phỏng vấn với ứng viên ${app.candidate.fullName} đã diễn ra. Vui lòng cập nhật trạng thái đã phỏng vấn hay chưa (Chấp nhận/Từ chối).`;

            await this.notificationsService.create(
              recruiterId,
              title,
              message,
              'warning',
              trackingLink
            );

            this.messagesGateway.server
              .to(`user_${recruiterId}`)
              .emit('notification', {
                title,
                message,
                type: 'warning',
                link: trackingLink
              });
          }
        }
      }
    } catch (err) {
      this.logger.error('Error in checkPastInterviews cron job:', err);
    }
  }
}
