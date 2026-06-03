import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { type CurrentUserPayload } from '@/common/decorators/current-user.decorator';
import { AiService } from '@/modules/intelligence/ai/ai.service';
import { ApplicationsNotificationService } from './services/applications-notification.service';
import { ApplicationStatusService } from './services/application-status.service';
import { ApplicationInterviewService } from './services/application-interview.service';
import { ApplicationStatsService } from './services/application-stats.service';
import { MessagesService } from '@/modules/communication/messages/messages.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private notificationService: ApplicationsNotificationService,
    private statusService: ApplicationStatusService,
    private interviewService: ApplicationInterviewService,
    private statsService: ApplicationStatsService,
    private messagesService: MessagesService,
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
    file?: any,
    user?: CurrentUserPayload,
  ) {
    const userId = user?.userId;

    if (userId && !user.roles.includes('CANDIDATE')) {
      throw new ForbiddenException(
        'Chỉ tài khoản ứng viên mới có thể nộp đơn ứng tuyển cho công việc.',
      );
    }

    const { jobPostingId, fullName, email, phone, coverLetter } =
      createApplicationDto;

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng!');

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter && recruiter.recruiterId === job.recruiterId) {
        throw new ForbiddenException(
          'Bạn không thể ứng tuyển vào tin tuyển dụng của chính mình.',
        );
      }
    }

    return await this.prisma.$transaction(
      async (tx) => {
        let candidateId: string;
        if (userId) {
          candidateId = await this.getAndValidateCandidate(tx, userId, user);
        } else {
          candidateId = await this.handleGuestApplication(
            tx,
            fullName,
            email,
            phone,
          );
        }

        let cvId: string | undefined = createApplicationDto.cvId;
        let fileUrl: string;

        if (cvId) {
          const existingCv = await tx.cV.findUnique({ where: { cvId } });
          if (!existingCv)
            throw new NotFoundException('Không tìm thấy CV được chọn!');
          fileUrl = existingCv.fileUrl || '';
        } else if (file) {
          const cvTitle = file.originalname;
          fileUrl = `/uploads/cvs/${file.filename}`;
          const newCV = await tx.cV.create({
            data: { cvTitle, fileUrl, candidateId, isMain: false },
          });
          cvId = newCV.cvId;
        } else {
          throw new NotFoundException(
            'Vui lòng tải lên CV hoặc chọn CV có sẵn!',
          );
        }

        const existingApp = await tx.application.findFirst({
          where: { candidateId, jobPostingId },
        });
        if (existingApp)
          throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

        const existingMatch = await tx.jobMatch.findUnique({
          where: { candidateId_jobPostingId: { candidateId, jobPostingId } },
        });

        let aiMatchScore = existingMatch?.score ?? 0;
        if (aiMatchScore === 0) {
          try {
            let cvText = '';
            if (fileUrl.startsWith('/uploads/')) {
              cvText = await this.aiService.extractTextFromLocalFile(fileUrl);
            } else {
              cvText = await this.aiService.extractTextFromPdfUrl(fileUrl);
            }
            if (cvText.trim()) {
              aiMatchScore = await this.aiService.evaluateMatch(
                cvText,
                job.title,
                job.requirements ? String(job.requirements) : '',
              );
            }
          } catch (aiErr) {
            console.error(
              'Lỗi khi tính điểm Match bằng AI trên tệp CV ứng tuyển:',
              aiErr,
            );
          }
        }

        let targetAppStatus = 'PENDING';
        let autoInterviewDate: Date | null = null;
        let autoInterviewTime: string | null = null;
        let autoInterviewLocation: string | null = null;

        const rejectThreshold = job.autoRejectThreshold ?? 40;
        if (aiMatchScore < rejectThreshold) {
          targetAppStatus = 'REJECTED';
        } else if (job.autoInviteMatches && aiMatchScore >= 90) {
          targetAppStatus = 'INTERVIEWING';
          autoInterviewDate = null;
          autoInterviewTime = null;
          autoInterviewLocation = null;
        }

        const application = await tx.application.create({
          data: {
            candidateId,
            jobPostingId,
            cvId,
            cvSnapshotUrl: fileUrl,
            coverLetter,
            appStatus: targetAppStatus as any,
            interviewDate: autoInterviewDate,
            interviewTime: autoInterviewTime,
            interviewLocation: autoInterviewLocation,
            aiMatchScore,
            isUnlocked: true,
            expectedResponseAt: new Date(
              Date.now() + (job.slaApplicationDays || 3) * 24 * 60 * 60 * 1000,
            ),
          },
          include: {
            jobPosting: { include: { recruiter: true } },
            candidate: { select: { fullName: true } },
          },
        });

        await this.notificationService.notifyRecruiterOfNewApplication(
          application,
        );

        if (targetAppStatus === 'INTERVIEWING') {
          const candidateUser = await tx.candidate.findUnique({
            where: { candidateId },
            select: { userId: true },
          });
          if (
            candidateUser?.userId &&
            application.jobPosting.recruiter?.userId &&
            application.jobPosting.recruiterId
          ) {
            if (autoInterviewDate && autoInterviewTime) {
              await this.notificationService.notifyCandidateOfAutoSchedule(
                candidateUser.userId,
                application.jobPosting.recruiter.userId,
                application.jobPosting.recruiterId,
                candidateId,
                application.jobPosting.title,
                autoInterviewTime,
                autoInterviewDate,
              );
            } else {
              // Ứng viên được đặc cách tự chọn ngày
              await this.notificationService.notifyCandidateOfFastTrack(
                candidateUser.userId,
                application.jobPosting.recruiter.userId,
                application.jobPosting.recruiterId,
                candidateId,
                application.jobPosting.title,
              );
            }
          }
        }

        return application;
      },
      { maxWait: 5000, timeout: 30000 },
    );
  }

  async findAllByJob(jobPostingId: string) {
    return this.prisma.application.findMany({
      where: { jobPostingId },
      include: { candidate: true, cv: true },
    });
  }

  async getKanbanApplications(jobPostingId: string) {
    return this.prisma.application.findMany({
      where: { jobPostingId },
      include: {
        candidate: {
          include: {
            user: {
              select: {
                avatar: true,
                email: true,
                phoneNumber: true,
                violations: true,
              },
            },
            skills: true,
            experiences: true,
            candidateReviews: {
              orderBy: { createdAt: 'desc' },
              include: { recruiter: { select: { fullName: true } } },
            },
          },
        },
        cv: true,
      },
      orderBy: { applyDate: 'desc' },
    });
  }

  async findAllByCandidate(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        jobPosting: { include: { company: true } },
        companyReview: true,
      },
      orderBy: { applyDate: 'desc' },
    });
  }

  async findAllForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate) return [];
    return this.findAllByCandidate(candidate.candidateId);
  }

  async findAllForRecruiter(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const jobFilter: any = {};
    if (recruiter.companyRole === 'MASTER' && recruiter.companyId) {
      jobFilter.companyId = recruiter.companyId;
    } else {
      jobFilter.recruiterId = recruiter.recruiterId;
    }

    const applications = await this.prisma.application.findMany({
      where: { jobPosting: jobFilter },
      include: {
        candidate: { include: { user: true, skills: true } },
        jobPosting: { select: { title: true, company: true } },
        cv: true,
      },
      orderBy: { aiMatchScore: 'desc' },
    });

    const unlocks = await this.prisma.candidateUnlock.findMany({
      where: { jobPosting: jobFilter },
    });
    const unlockedSet = new Set(
      unlocks.map((u) => `${u.candidateId}_${u.jobPostingId}`),
    );

    const jobMatches = await this.prisma.jobMatch.findMany({
      where: { jobPosting: jobFilter },
    });
    const matchMap = new Map(
      jobMatches.map((m) => [`${m.candidateId}_${m.jobPostingId}`, m]),
    );

    return applications.map((app) => {
      const matchData = matchMap.get(`${app.candidateId}_${app.jobPostingId}`);
      const isActuallyUnlocked =
        app.isUnlocked ||
        unlockedSet.has(`${app.candidateId}_${app.jobPostingId}`);
      const accurateScore =
        matchData?.score && matchData.score > 0
          ? matchData.score
          : app.aiMatchScore;

      if (!isActuallyUnlocked) {
        return this.statusService.obfuscateApplication(app, accurateScore || 0);
      }
      return { ...app, isUnlocked: true, aiMatchScore: accurateScore || 0 };
    });
  }

  async updateStatus(
    applicationId: string,
    actionUserId: string,
    status: any,
    interviewDate?: string,
    interviewTime?: string,
    interviewLocation?: string,
  ) {
    return this.statusService.updateStatus(
      applicationId,
      actionUserId,
      status,
      interviewDate,
      interviewTime,
      interviewLocation,
    );
  }

  async updateBulkStatus(
    actionUserId: string,
    applicationIds: string[],
    status: any,
    interviewDate?: string,
    interviewTime?: string,
    interviewLocation?: string,
  ) {
    return this.statusService.updateBulkStatus(
      actionUserId,
      applicationIds,
      status,
      interviewDate,
      interviewTime,
      interviewLocation,
    );
  }

  async unlockApplication(applicationId: string, recruiterUserId: string) {
    return this.statusService.unlockApplication(applicationId, recruiterUserId);
  }

  async remove(applicationId: string, candidateUserId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { candidate: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.candidate?.userId !== candidateUserId)
      throw new ConflictException('Unauthorized to delete this application');

    return this.prisma.application.delete({ where: { applicationId } });
  }

  async confirmInterview(applicationId: string, candidateUserId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: {
        candidate: true,
        jobPosting: { include: { recruiter: true } },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.candidate?.userId !== candidateUserId)
      throw new ForbiddenException('Unauthorized');

    const updated = await this.prisma.application.update({
      where: { applicationId },
      data: {
        appStatus: 'INTERVIEW_CONFIRMED',
        candidateResponseAt: null,
      },
    });

    // Notify Recruiter
    if (application.jobPosting.recruiter?.userId) {
      await this.notificationService.notifyRecruiterOfCandidateAction(
        application.jobPosting.recruiter.userId,
        application.jobPosting.title,
        application.candidate.fullName,
        'CONFIRM',
      );
    }
    return updated;
  }

  async requestReschedule(
    applicationId: string,
    candidateUserId: string,
    proposedDate: string,
    proposedTime: string,
    reason: string,
  ) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: {
        candidate: true,
        jobPosting: { include: { recruiter: true } },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.candidate?.userId !== candidateUserId)
      throw new ForbiddenException('Unauthorized');

    const updated = await this.prisma.application.update({
      where: { applicationId },
      data: {
        appStatus: 'RESCHEDULE_REQUESTED',
        candidateResponseAt: null,
        // Optional: save proposed details in a note/feedback field or create a new field
        feedback: `Ứng viên xin dời lịch: ${proposedDate} lúc ${proposedTime}. Lý do: ${reason}`,
      },
    });

    // Notify Recruiter
    if (application.jobPosting.recruiter?.userId) {
      await this.notificationService.notifyRecruiterOfCandidateAction(
        application.jobPosting.recruiter.userId,
        application.jobPosting.title,
        application.candidate.fullName,
        'RESCHEDULE',
        `${proposedDate} lúc ${proposedTime} - Lý do: ${reason}`,
      );
    }
    return updated;
  }

  async getRecruiterStats(userId: string) {
    return this.statsService.getRecruiterStats(userId);
  }

  private async getAndValidateCandidate(
    tx: any,
    userId: string,
    user: CurrentUserPayload,
  ) {
    if (!user.roles.includes('CANDIDATE'))
      throw new ForbiddenException(
        'Chỉ tài khoản ứng viên mới có thể nộp đơn ứng tuyển cho công việc.',
      );
    const candidate = await tx.candidate.findUnique({ where: { userId } });
    if (!candidate)
      throw new NotFoundException(
        'Không tìm thấy hồ sơ ứng viên. Vui lòng hoàn tất thông tin ứng viên của bạn trước.',
      );

    if (!candidate.isOpenToWork) {
      throw new ForbiddenException(
        'Bạn cần bật trạng thái "Đang tìm việc" để có thể ứng tuyển.',
      );
    }

    if (
      !candidate.jobSearchExpiresAt ||
      candidate.jobSearchExpiresAt < new Date()
    ) {
      throw new ForbiddenException(
        'Tài khoản tìm việc của bạn đã hết hạn, vui lòng kích hoạt lại để ứng tuyển.',
      );
    }

    return candidate.candidateId;
  }

  private async handleGuestApplication(
    tx: any,
    fullName: string,
    email: string,
    phone: string,
  ) {
    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      user = await tx.user.create({
        data: { email, status: 'ACTIVE', phoneNumber: phone },
      });
      const roleRecord = await tx.role.upsert({
        where: { roleName: 'CANDIDATE' },
        update: {},
        create: { roleName: 'CANDIDATE' },
      });
      await tx.userRole.create({
        data: { userId: user.userId, roleId: roleRecord.roleId },
      });
      const newCandidate = await tx.candidate.create({
        data: { userId: user.userId, fullName },
      });
      return newCandidate.candidateId;
    }
    const candidate = await tx.candidate.findUnique({
      where: { userId: user.userId },
    });
    if (!candidate) {
      const newCandidate = await tx.candidate.create({
        data: { userId: user.userId, fullName },
      });
      return newCandidate.candidateId;
    }

    if (!candidate.isOpenToWork) {
      throw new ForbiddenException(
        'Email này đã có tài khoản. Vui lòng đăng nhập và bật trạng thái "Đang tìm việc" để ứng tuyển.',
      );
    }

    if (
      !candidate.jobSearchExpiresAt ||
      candidate.jobSearchExpiresAt < new Date()
    ) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã hết hạn tìm việc, vui lòng đăng nhập và kích hoạt lại để ứng tuyển.',
      );
    }

    return candidate.candidateId;
  }
}
