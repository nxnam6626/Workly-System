import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { AiService } from '../ai/ai.service';
import { ApplicationsNotificationService } from './services/applications-notification.service';
import { ApplicationStatusService } from './services/application-status.service';
import { ApplicationInterviewService } from './services/application-interview.service';
import { ApplicationStatsService } from './services/application-stats.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private notificationService: ApplicationsNotificationService,
    private statusService: ApplicationStatusService,
    private interviewService: ApplicationInterviewService,
    private statsService: ApplicationStatsService,
  ) { }

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

    const { jobPostingId, fullName, email, phone, coverLetter } = createApplicationDto;

    const job = await this.prisma.jobPosting.findUnique({ where: { jobPostingId } });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng!');

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
      if (recruiter && recruiter.recruiterId === job.recruiterId) {
        throw new ForbiddenException('Bạn không thể ứng tuyển vào tin tuyển dụng của chính mình.');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      let candidateId: string;
      if (userId) {
        candidateId = await this.getAndValidateCandidate(tx, userId, user);
      } else {
        candidateId = await this.handleGuestApplication(tx, fullName, email, phone);
      }

      let cvId: string | undefined = createApplicationDto.cvId;
      let fileUrl: string;

      if (cvId) {
        const existingCv = await tx.cV.findUnique({ where: { cvId } });
        if (!existingCv) throw new NotFoundException('Không tìm thấy CV được chọn!');
        fileUrl = existingCv.fileUrl || '';
      } else if (file) {
        const cvTitle = file.originalname;
        fileUrl = `/uploads/cvs/${file.filename}`;
        const newCV = await tx.cV.create({
          data: { cvTitle, fileUrl, candidateId, isMain: false },
        });
        cvId = newCV.cvId;
      } else {
        throw new NotFoundException('Vui lòng tải lên CV hoặc chọn CV có sẵn!');
      }

      const existingApp = await tx.application.findFirst({ where: { candidateId, jobPostingId } });
      if (existingApp) throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

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
            aiMatchScore = await this.aiService.evaluateMatch(cvText, job.title, job.requirements ? String(job.requirements) : '');
          }
        } catch (aiErr) {
          console.error('Lỗi khi tính điểm Match bằng AI trên tệp CV ứng tuyển:', aiErr);
        }
      }

      let targetAppStatus = 'PENDING';
      let autoInterviewDate: Date | null = null;
      let autoInterviewTime: string | null = null;
      let autoInterviewLocation: string | null = null;

      if (aiMatchScore >= 80) {
        targetAppStatus = 'INTERVIEWING';
        const slot = await this.interviewService.findAvailableInterviewSlot(jobPostingId);
        autoInterviewDate = slot.date;
        autoInterviewTime = slot.time;
        autoInterviewLocation = 'Workly System tự động xếp lịch. Vui lòng đợi HR liên hệ ấn định chi tiết (Phỏng vấn qua Meet/Trực tiếp).';
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
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: { select: { fullName: true } },
        },
      });

      await this.notificationService.notifyRecruiterOfNewApplication(application);

      if (targetAppStatus === 'INTERVIEWING' && autoInterviewDate && autoInterviewTime) {
        const candidateUser = await tx.candidate.findUnique({ where: { candidateId }, select: { userId: true } });
        if (candidateUser?.userId && application.jobPosting.recruiter?.userId && application.jobPosting.recruiterId) {
          await this.notificationService.notifyCandidateOfAutoSchedule(
            candidateUser.userId,
            application.jobPosting.recruiter.userId,
            application.jobPosting.recruiterId,
            candidateId,
            application.jobPosting.title,
            autoInterviewTime,
            autoInterviewDate,
          );
        }
      }

      return application;
    }, { maxWait: 5000, timeout: 30000 });
  }

  async findAllByJob(jobPostingId: string) {
    return this.prisma.application.findMany({
      where: { jobPostingId },
      include: { candidate: true, cv: true },
    });
  }

  async findAllByCandidate(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: { jobPosting: { include: { company: true } } },
      orderBy: { applyDate: 'desc' },
    });
  }

  async findAllForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { userId } });
    if (!candidate) return [];
    return this.findAllByCandidate(candidate.candidateId);
  }

  async findAllForRecruiter(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const applications = await this.prisma.application.findMany({
      where: { jobPosting: { recruiterId: recruiter.recruiterId } },
      include: {
        candidate: { include: { user: true, skills: true } },
        jobPosting: { select: { title: true, company: true } },
        cv: true,
      },
      orderBy: { aiMatchScore: 'desc' },
    });

    const unlocks = await this.prisma.candidateUnlock.findMany({ where: { recruiterId: recruiter.recruiterId } });
    const unlockedSet = new Set(unlocks.map((u) => `${u.candidateId}_${u.jobPostingId}`));

    const jobMatches = await this.prisma.jobMatch.findMany({ where: { jobPosting: { recruiterId: recruiter.recruiterId } } });
    const matchMap = new Map(jobMatches.map((m) => [`${m.candidateId}_${m.jobPostingId}`, m]));

    return applications.map((app) => {
      const matchData = matchMap.get(`${app.candidateId}_${app.jobPostingId}`);
      const isActuallyUnlocked = app.isUnlocked || unlockedSet.has(`${app.candidateId}_${app.jobPostingId}`);
      const accurateScore = matchData?.score && matchData.score > 0 ? matchData.score : app.aiMatchScore;

      if (!isActuallyUnlocked) {
        return this.statusService.obfuscateApplication(app, accurateScore || 0);
      }
      return { ...app, isUnlocked: true, aiMatchScore: accurateScore || 0 };
    });
  }

  async updateStatus(applicationId: string, actionUserId: string, status: any, interviewDate?: string, interviewTime?: string, interviewLocation?: string) {
    return this.statusService.updateStatus(applicationId, actionUserId, status, interviewDate, interviewTime, interviewLocation);
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

  async getRecruiterStats(userId: string) {
    return this.statsService.getRecruiterStats(userId);
  }

  private async getAndValidateCandidate(tx: any, userId: string, user: CurrentUserPayload) {
    if (!user.roles.includes('CANDIDATE')) throw new ForbiddenException('Chỉ tài khoản ứng viên mới có thể nộp đơn ứng tuyển cho công việc.');
    const candidate = await tx.candidate.findUnique({ where: { userId } });
    if (!candidate) throw new NotFoundException('Không tìm thấy hồ sơ ứng viên. Vui lòng hoàn tất thông tin ứng viên của bạn trước.');
    return candidate.candidateId;
  }

  private async handleGuestApplication(tx: any, fullName: string, email: string, phone: string) {
    let user = await tx.user.findUnique({ where: { email } });
    if (!user) {
      user = await tx.user.create({ data: { email, status: 'ACTIVE', phoneNumber: phone } });
      const roleRecord = await tx.role.upsert({ where: { roleName: 'CANDIDATE' }, update: {}, create: { roleName: 'CANDIDATE' } });
      await tx.userRole.create({ data: { userId: user.userId, roleId: roleRecord.roleId } });
      const newCandidate = await tx.candidate.create({ data: { userId: user.userId, fullName } });
      return newCandidate.candidateId;
    }
    const candidate = await tx.candidate.findUnique({ where: { userId: user.userId } });
    if (!candidate) {
      const newCandidate = await tx.candidate.create({ data: { userId: user.userId, fullName } });
      return newCandidate.candidateId;
    }
    return candidate.candidateId;
  }
}
