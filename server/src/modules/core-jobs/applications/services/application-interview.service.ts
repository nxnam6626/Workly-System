import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { MessagesService } from '@/modules/communication/messages/messages.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class ApplicationInterviewService {
  private readonly logger = new Logger(ApplicationInterviewService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
    private messagesService: MessagesService,
  ) {}

  async findAvailableInterviewSlot(jobPostingId: string, recruiterId: string, overrideMinNoticeHours?: number) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
    });

    const settings: any = (recruiter as any)?.interviewSettings || {
      timeSlots: ['08:00', '10:00', '14:00', '16:00'],
      blockedDates: [],
      maxCandidatesPerSlot: 1,
      minNoticeHours: 24,
      maxAdvanceDays: 14,
    };

    const possibleSlots: string[] = settings.timeSlots || ['08:00', '10:00', '14:00', '16:00'];
    const blockedDates: string[] = settings.blockedDates || [];
    const maxCandidatesPerSlot = settings.maxCandidatesPerSlot || 1;
    const minNoticeHours = overrideMinNoticeHours !== undefined ? overrideMinNoticeHours : (settings.minNoticeHours || 24);
    const maxAdvanceDays = settings.maxAdvanceDays || 14;

    const today = new Date();
    const earliestAllowedTime = new Date(today.getTime() + minNoticeHours * 60 * 60 * 1000);
    const vnTimeNow = new Date(today.getTime() + 7 * 60 * 60 * 1000);

    for (let i = 0; i <= maxAdvanceDays; i++) {
      const vnDate = new Date(vnTimeNow.getTime() + i * 24 * 60 * 60 * 1000);
      const year = vnDate.getUTCFullYear();
      const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
      const date = String(vnDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;

      if (blockedDates.includes(dateStr)) continue;

      const dayOfWeek = vnDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      const startOfDay = new Date(Date.UTC(year, vnDate.getUTCMonth(), vnDate.getUTCDate(), -7, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(year, vnDate.getUTCMonth(), vnDate.getUTCDate(), 23 - 7, 59, 59, 999));

      const scheduledApps = await this.prisma.application.findMany({
        where: {
          jobPosting: { recruiterId },
          appStatus: { in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED'] },
          interviewDate: { gte: startOfDay, lte: endOfDay },
        },
        select: { interviewTime: true },
      });

      const slotCounts: Record<string, number> = {};
      possibleSlots.forEach((s) => (slotCounts[s] = 0));
      scheduledApps.forEach((app) => {
        if (app.interviewTime && slotCounts[app.interviewTime] !== undefined) {
          slotCounts[app.interviewTime]++;
        }
      });

      for (const slot of possibleSlots) {
        const [hours, mins] = slot.split(':').map(Number);
        const slotTime = new Date(Date.UTC(year, vnDate.getUTCMonth(), vnDate.getUTCDate(), hours - 7, mins, 0, 0));

        if (slotTime < earliestAllowedTime) continue;

        if (slotCounts[slot] < maxCandidatesPerSlot) {
          return {
            date: startOfDay,
            time: slot,
            location: settings.defaultLocation || 'Trao đổi qua tin nhắn',
          };
        }
      }
    }

    return { date: null, time: null, location: null };
  }

  async getAvailableSlots(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { jobPosting: { select: { recruiter: true } }, appStatus: true },
    });

    if (
      !application ||
      !['INTERVIEWING', 'RESCHEDULE_REQUESTED', 'INTERVIEW_CONFIRMED'].includes(application.appStatus)
    ) {
      return [];
    }

    const recruiter = application.jobPosting.recruiter;
    const settings: any = (recruiter as any)?.interviewSettings || {
      timeSlots: ['08:00', '10:00', '14:00', '16:00'],
      blockedDates: [],
      maxCandidatesPerSlot: 1,
      minNoticeHours: 24,
      maxAdvanceDays: 14,
    };

    const availableDays: any[] = [];
    const possibleSlots: string[] = settings.timeSlots || [
      '08:00',
      '10:00',
      '14:00',
      '16:00',
    ];
    const blockedDates: string[] = settings.blockedDates || [];
    const maxCandidatesPerSlot = settings.maxCandidatesPerSlot || 1;
    const minNoticeHours = settings.minNoticeHours || 24;
    const maxAdvanceDays = settings.maxAdvanceDays || 14;

    const today = new Date();
    // Add minNoticeHours to today to get the first allowed time
    const earliestAllowedTime = new Date(
      today.getTime() + minNoticeHours * 60 * 60 * 1000,
    );

    // Get current date in Vietnam Time (UTC+7)
    const vnTimeNow = new Date(today.getTime() + 7 * 60 * 60 * 1000);

    // Look ahead from today to maxAdvanceDays
    for (let i = 0; i <= maxAdvanceDays; i++) {
      const vnDate = new Date(vnTimeNow.getTime() + i * 24 * 60 * 60 * 1000);

      const year = vnDate.getUTCFullYear();
      const month = String(vnDate.getUTCMonth() + 1).padStart(2, '0');
      const date = String(vnDate.getUTCDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${date}`;

      // Skip blocked dates
      if (blockedDates.includes(dateStr)) continue;

      // Skip weekends
      const dayOfWeek = vnDate.getUTCDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;

      // startOfDay in VN time is 00:00:00 (which is 17:00:00 UTC previous day)
      const startOfDay = new Date(
        Date.UTC(year, vnDate.getUTCMonth(), vnDate.getUTCDate(), -7, 0, 0, 0),
      );
      // endOfDay in VN time is 23:59:59 (which is 16:59:59 UTC today)
      const endOfDay = new Date(
        Date.UTC(
          year,
          vnDate.getUTCMonth(),
          vnDate.getUTCDate(),
          23 - 7,
          59,
          59,
          999,
        ),
      );

      const scheduledApps = await this.prisma.application.findMany({
        where: {
          jobPosting: { recruiterId: recruiter?.recruiterId },
          appStatus: { in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED'] },
          interviewDate: { gte: startOfDay, lte: endOfDay },
        },
        select: { interviewTime: true },
      });

      const slotCounts: Record<string, number> = {};
      possibleSlots.forEach((s) => (slotCounts[s] = 0));
      scheduledApps.forEach((app) => {
        if (app.interviewTime && slotCounts[app.interviewTime] !== undefined) {
          slotCounts[app.interviewTime]++;
        }
      });

      const availableTimeSlots = possibleSlots.filter((slot) => {
        // Must check if the specific slot is past earliestAllowedTime
        const [hours, mins] = slot.split(':').map(Number);

        // Calculate absolute time of the slot (assuming slot hours are in VN time)
        const slotTime = new Date(
          Date.UTC(
            year,
            vnDate.getUTCMonth(),
            vnDate.getUTCDate(),
            hours - 7,
            mins,
            0,
            0,
          ),
        );

        if (slotTime < earliestAllowedTime) return false;

        return slotCounts[slot] < maxCandidatesPerSlot;
      });

      if (availableTimeSlots.length > 0) {
        availableDays.push({
          date: dateStr,
          slots: availableTimeSlots,
        });
      }
    }

    return {
      availableDays,
      defaultLocation: settings.defaultLocation || 'Trao đổi qua tin nhắn',
    };
  }

  async candidateScheduleInterview(
    applicationId: string,
    candidateUserId: string,
    date: string,
    time: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: {
        jobPosting: { include: { recruiter: true, company: true } },
        candidate: true,
      },
    });

    if (
      !application ||
      !['INTERVIEWING', 'RESCHEDULE_REQUESTED', 'INTERVIEW_CONFIRMED'].includes(application.appStatus)
    ) {
      throw new BadRequestException('Đơn ứng tuyển không ở trạng thái chờ phỏng vấn');
    }

    if (application.candidate.userId !== candidateUserId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    const settings: any =
      (application.jobPosting.recruiter as any)?.interviewSettings || {};
    const minNoticeHours = settings.minNoticeHours || 24;

    if (
      application.appStatus === 'INTERVIEW_CONFIRMED' &&
      application.interviewDate &&
      application.interviewTime
    ) {
      const [hours, mins] = application.interviewTime.split(':').map(Number);
      const currentInterviewTime = new Date(
        Date.UTC(
          application.interviewDate.getUTCFullYear(),
          application.interviewDate.getUTCMonth(),
          application.interviewDate.getUTCDate(),
          hours - 7,
          mins,
          0,
          0,
        ),
      );

      const minNoticeTimeMs = Date.now() + minNoticeHours * 60 * 60 * 1000;
      if (currentInterviewTime.getTime() < minNoticeTimeMs) {
        throw new BadRequestException(
          `Bạn chỉ có thể dời lịch trước khi phỏng vấn ít nhất ${minNoticeHours} tiếng.`,
        );
      }
    }

    const interviewDate = new Date(date);
    const interviewLocation =
      settings.defaultLocation ||
      application.jobPosting.company?.address ||
      'Trao đổi qua tin nhắn';

    await this.prisma.application.update({
      where: { applicationId },
      data: {
        interviewDate,
        interviewTime: time,
        interviewLocation: interviewLocation,
        appStatus: 'INTERVIEW_CONFIRMED',
        candidateResponseAt: null,
      },
    });

    // Send system message
    if (application.jobPosting.recruiter?.userId) {
      try {
        const content = `[Hệ thống Workly] Ứng viên ${application.candidate.fullName} đã xác nhận lịch phỏng vấn vào lúc ${time} ngày ${date.split('-').reverse().join('/')}. Địa điểm/Hình thức: ${interviewLocation}.`;

        const conv = await this.messagesService.createConversation(
          application.candidateId,
          application.jobPosting.recruiterId!,
        );

        const savedMessage = await this.messagesService.sendMessage(
          application.jobPosting.recruiter.userId,
          conv.conversationId,
          content,
          true, // isSystemMessage
        );

        this.messagesGateway.server
          .to(`user_${application.jobPosting.recruiter.userId}`)
          .emit('dashboard.sync');
        this.messagesGateway.server
          .to(`user_${application.candidate.userId}`)
          .emit('notification');

        // Emit newMessage to both parties
        this.messagesGateway.server
          .to(`user_${application.candidate.userId}`)
          .emit('newMessage', savedMessage);
        this.messagesGateway.server
          .to(`user_${application.jobPosting.recruiter.userId}`)
          .emit('newMessage', savedMessage);
      } catch (err) {
        this.logger.error('Failed to send auto-schedule message', err);
      }
    }

    return { success: true, message: 'Đã lên lịch thành công' };
  }

  @Cron('* * * * *')
  async checkPastInterviews() {
    try {
      const now = new Date();

      const interviewingApps = await this.prisma.application.findMany({
        where: {
          appStatus: 'INTERVIEWING',
          interviewDate: { not: null },
          interviewTime: { not: null },
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: true,
        },
      });

      for (const app of interviewingApps) {
        if (
          !app.interviewDate ||
          !app.interviewTime ||
          !app.jobPosting.recruiter?.userId
        )
          continue;

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
              link: trackingLink,
            },
          });

          if (!existingNotif) {
            const title = 'Cập nhật kết quả phỏng vấn';
            const message = `Buổi phỏng vấn với ứng viên ${app.candidate.fullName} đã diễn ra. Vui lòng cập nhật trạng thái đã phỏng vấn hay chưa (Chấp nhận/Từ chối).`;

            await this.notificationsService.create(
              recruiterId,
              title,
              message,
              'warning',
              trackingLink,
            );

            this.messagesGateway.server
              .to(`user_${recruiterId}`)
              .emit('notification', {
                title,
                message,
                type: 'warning',
                link: trackingLink,
              });
          }
        }
      }
    } catch (err) {
      this.logger.error('Error in checkPastInterviews cron job:', err);
    }
  }

  @Cron('*/5 * * * *') // Run every 5 minutes
  async checkUpcomingInterviews() {
    try {
      const now = new Date();

      const upcomingApps = await this.prisma.application.findMany({
        where: {
          appStatus: { in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED'] },
          interviewDate: { not: null },
          interviewTime: { not: null },
        },
        include: {
          jobPosting: { include: { company: true } },
          candidate: { select: { userId: true, fullName: true } },
        },
      });

      for (const app of upcomingApps) {
        if (!app.interviewDate || !app.interviewTime || !app.candidate?.userId)
          continue;

        const [hours, minutes] = app.interviewTime.split(':').map(Number);
        const interviewDateTime = new Date(app.interviewDate);
        interviewDateTime.setHours(hours, minutes, 0, 0);

        const timeDiffMs = interviewDateTime.getTime() - now.getTime();
        if (timeDiffMs <= 0) continue; // Already passed

        const hoursLeft = timeDiffMs / (1000 * 60 * 60);
        const companyName = app.jobPosting.company?.companyName || 'Công ty';

        // 24H Reminder
        if (hoursLeft <= 24 && hoursLeft > 23) {
          const trackingLink = `/applied-jobs?remind24h=${app.applicationId}`;
          const existing = await this.prisma.notification.findFirst({
            where: { userId: app.candidate.userId, link: trackingLink },
          });
          if (!existing) {
            await this.notificationsService.create(
              app.candidate.userId,
              'Nhắc nhở phỏng vấn (Còn 24 giờ)',
              `Bạn có lịch phỏng vấn với ${companyName} cho vị trí "${app.jobPosting.title}" vào ngày mai lúc ${app.interviewTime}. Đừng quên nhé!`,
              'info',
              trackingLink,
            );
          }
        }

        // 1H Reminder
        if (hoursLeft <= 1 && hoursLeft > 0) {
          const trackingLink = `/applied-jobs?remind1h=${app.applicationId}`;
          const existing = await this.prisma.notification.findFirst({
            where: { userId: app.candidate.userId, link: trackingLink },
          });
          if (!existing) {
            await this.notificationsService.create(
              app.candidate.userId,
              'Sắp đến giờ phỏng vấn!',
              `Chỉ còn 1 tiếng nữa là đến buổi phỏng vấn với ${companyName}. Chúc bạn tự tin và thành công!`,
              'warning',
              trackingLink,
            );
          }
        }
      }
    } catch (err) {
      this.logger.error('Error in checkUpcomingInterviews cron job:', err);
    }
  }
}
