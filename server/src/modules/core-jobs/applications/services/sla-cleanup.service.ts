import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { ApplicationsNotificationService } from './applications-notification.service';

@Injectable()
export class SlaCleanupService {
  private readonly logger = new Logger(SlaCleanupService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: ApplicationsNotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async checkSlaBreaches() {
    this.logger.log('Running SLA Breach Check...');
    const now = new Date();

    // 1. Check Recruiter Response SLA (PENDING/REVIEWED)
    const pendingBreaches = await this.prisma.application.findMany({
      where: {
        appStatus: { in: ['PENDING', 'REVIEWED'] },
        expectedResponseAt: { lt: now },
      },
      include: {
        jobPosting: {
          include: { recruiter: true },
        },
        candidate: true,
      },
    });

    for (const app of pendingBreaches) {
      if (app.jobPosting.recruiter?.userId) {
        await this.notificationService.notifySlaBreach(
          app.jobPosting.recruiter.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          'RECRUITER_RESPONSE',
        );
        
        // Update application to mark as breach (optional, but good for reporting)
        // We might want a flag like 'isSlaBreached: true' in the schema later
      }
    }

    // 2. Check Candidate Interview Response SLA
    const candidateBreaches = await this.prisma.application.findMany({
      where: {
        appStatus: 'INTERVIEWING',
        candidateResponseAt: { lt: now },
      },
      include: {
        candidate: {
          include: { user: true },
        },
        jobPosting: true,
      },
    });

    for (const app of candidateBreaches) {
      if (app.candidate.user?.userId) {
        await this.notificationService.notifySlaBreach(
          app.candidate.user.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          'CANDIDATE_INTERVIEW',
        );

        // Auto-reject or move to a 'EXPIRED' state if candidate doesn't respond?
        // Let's keep it simple and just notify for now, or we can mark it.
      }
    }

    // 3. Check Recruiter Interview Result SLA
    const resultBreaches = await this.prisma.application.findMany({
      where: {
        appStatus: 'INTERVIEWING',
        candidateResponseAt: null, // Confirmed
        expectedResultAt: { lt: now },
      },
      include: {
        jobPosting: {
          include: { recruiter: true },
        },
        candidate: true,
      },
    });

    for (const app of resultBreaches) {
      if (app.jobPosting.recruiter?.userId) {
        await this.notificationService.notifySlaBreach(
          app.jobPosting.recruiter.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          'RECRUITER_RESULT',
        );
      }
    }

    this.logger.log(`SLA check completed. Found ${pendingBreaches.length + candidateBreaches.length + resultBreaches.length} breaches.`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendSlaReminders() {
    this.logger.log('Sending SLA Reminders...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    // Find apps with deadlines in the next 24-48 hours
    const upcomingDeadlines = await this.prisma.application.findMany({
      where: {
        OR: [
          { expectedResponseAt: { gte: tomorrow, lt: dayAfterTomorrow } },
          { expectedResultAt: { gte: tomorrow, lt: dayAfterTomorrow } },
          { candidateResponseAt: { gte: tomorrow, lt: dayAfterTomorrow } },
        ],
      },
      include: {
        jobPosting: { include: { recruiter: true } },
        candidate: { include: { user: true } },
      },
    });

    for (const app of upcomingDeadlines) {
      if (app.expectedResponseAt && app.jobPosting.recruiter?.userId) {
        await this.notificationService.notifySlaReminder(
          app.jobPosting.recruiter.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          app.expectedResponseAt,
          'RECRUITER_RESPONSE',
        );
      }
      
      if (app.expectedResultAt && app.jobPosting.recruiter?.userId) {
        await this.notificationService.notifySlaReminder(
          app.jobPosting.recruiter.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          app.expectedResultAt,
          'RECRUITER_RESULT',
        );
      }

      if (app.candidateResponseAt && app.candidate.user?.userId) {
        await this.notificationService.notifySlaReminder(
          app.candidate.user.userId,
          app.jobPosting.title,
          app.candidate.fullName,
          app.candidateResponseAt,
          'CANDIDATE_INTERVIEW',
        );
      }
    }
  }
}
