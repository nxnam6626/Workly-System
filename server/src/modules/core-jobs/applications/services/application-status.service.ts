import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WalletsService } from '@/modules/billing/wallets/wallets.service';
import { ApplicationsNotificationService } from './applications-notification.service';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class ApplicationStatusService {
  constructor(
    private prisma: PrismaService,
    private walletsService: WalletsService,
    private notificationService: ApplicationsNotificationService,
    private mailService: MailService,
  ) {}

  async updateStatus(
    applicationId: string,
    actionUserId: string,
    status: any,
    interviewDate?: string,
    interviewTime?: string,
    interviewLocation?: string,
  ) {
    const existingApp = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { interviewDate: true, appStatus: true, jobPostingId: true },
    });

    const isReschedule =
      status === 'INTERVIEWING' &&
      existingApp?.appStatus === 'INTERVIEWING' &&
      existingApp?.interviewDate != null;

    const dataToUpdate: any = { appStatus: status };
    if (status === 'INTERVIEWING') {
      if (interviewDate) dataToUpdate.interviewDate = new Date(interviewDate);
      if (interviewTime) dataToUpdate.interviewTime = interviewTime;
      if (interviewLocation) dataToUpdate.interviewLocation = interviewLocation;
    }

    if (
      status === 'ACCEPTED' &&
      existingApp &&
      existingApp.appStatus !== 'ACCEPTED'
    ) {
      await this.prisma.jobPosting.update({
        where: { jobPostingId: existingApp.jobPostingId },
        data: {
          vacancies: { decrement: 1 },
        },
      });
    }

    const application = await this.prisma.application.update({
      where: { applicationId },
      data: dataToUpdate,
      include: {
        jobPosting: {
          select: {
            title: true,
            recruiterId: true,
            recruiter: { select: { userId: true } },
            company: { select: { companyName: true } },
          },
        },
        candidate: {
          select: { userId: true, fullName: true, candidateId: true, user: { select: { email: true } } },
        },
      },
    });

    if (application.candidate?.userId) {
      const candidateUserId = application.candidate.userId;
      const companyName =
        application.jobPosting?.company?.companyName || 'Công ty';
      const jobTitle = application.jobPosting?.title || 'Công việc';

      const notificationMessage =
        await this.notificationService.notifyCandidateOfStatusUpdate(
          candidateUserId,
          companyName,
          jobTitle,
          status,
          { interviewDate, interviewTime, interviewLocation, isReschedule },
        );

      if (['INTERVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
        const actionRecruiter = await this.prisma.recruiter.findUnique({
          where: { userId: actionUserId },
        });
        const recruiterId =
          actionRecruiter?.recruiterId || application.jobPosting.recruiterId;
        const candidateId = application.candidate.candidateId;

        if (recruiterId && candidateId) {
          await this.notificationService.injectAutoChatMessage(
            actionUserId,
            recruiterId,
            candidateId,
            notificationMessage,
            candidateUserId,
          );
        }
      }

      if (status === 'INTERVIEWING' && interviewDate && interviewTime) {
        const candidateEmail = application.candidate.user?.email;
        if (candidateEmail) {
          await this.mailService.sendInterviewInviteICS(
            candidateEmail,
            application.candidate.fullName,
            companyName,
            jobTitle,
            interviewDate,
            interviewTime,
            interviewLocation || 'Đang cập nhật',
          );
        }
      }
    }

    return application;
  }

  async updateBulkStatus(
    actionUserId: string,
    applicationIds: string[],
    status: any,
    interviewDate?: string,
    interviewTime?: string,
    interviewLocation?: string,
  ) {
    const results: any[] = [];
    for (const id of applicationIds) {
      try {
        const result = await this.updateStatus(
          id,
          actionUserId,
          status,
          interviewDate,
          interviewTime,
          interviewLocation,
        );
        results.push(result);
      } catch (err) {
        console.error(`Failed to update status for application ${id}:`, err);
      }
    }
    return { success: true, updatedCount: results.length };
  }

  async unlockApplication(applicationId: string, recruiterUserId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
    });

    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { candidate: true },
    });

    if (!application) throw new NotFoundException('Application not found');
    if (application.isUnlocked) return application;

    await this.walletsService.deductCvUnlock(
      recruiter.recruiterId,
      `Mở khóa ứng viên: ${application.candidate?.fullName}`,
    );

    const updated = await this.prisma.application.update({
      where: { applicationId },
      data: {
        isUnlocked: true,
        appStatus: application.appStatus === 'PENDING' ? 'REVIEWED' : application.appStatus,
      },
      include: {
        jobPosting: {
          select: {
            title: true,
            recruiterId: true,
            recruiter: { select: { userId: true } },
            company: { select: { companyName: true } },
          },
        },
        candidate: {
          select: { userId: true, fullName: true, candidateId: true },
        },
      },
    });

    if (application.appStatus === 'PENDING' && updated.candidate?.userId) {
      await this.notificationService.notifyCandidateOfStatusUpdate(
        updated.candidate.userId,
        updated.jobPosting?.company?.companyName || 'Công ty',
        updated.jobPosting?.title || 'Công việc',
        'REVIEWED',
      );
    }

    return updated;
  }

  obfuscateApplication(app: any, accurateScore: number) {
    return {
      ...app,
      isUnlocked: false,
      aiMatchScore: accurateScore,
      candidate: {
        ...app.candidate,
        fullName: '*** Ứng viên ẩn ***',
        user: {
          ...app.candidate.user,
          email: '***@***.***',
          phoneNumber: '***',
        },
      },
      cv: {
        ...app.cv,
        fileUrl: '',
      },
      cvSnapshotUrl: '',
    };
  }
}
