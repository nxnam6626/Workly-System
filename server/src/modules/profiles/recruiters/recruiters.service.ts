import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MessagesService } from '@/modules/communication/messages/messages.service';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class RecruitersService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private messagesGateway: MessagesGateway,
    private mailService: MailService,
  ) {}

  private async ensureRecruiter(userId: string) {
    let recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter) {
      recruiter = await this.prisma.recruiter.create({
        data: { userId },
      });
    }

    return recruiter;
  }

  async getInterviewSettings(userId: string) {
    const recruiter = await this.ensureRecruiter(userId);
    return (recruiter as any).interviewSettings || {
      defaultLocation: '',
      timeSlots: ['08:00', '10:00', '14:00', '16:00'],
      blockedDates: [],
      maxCandidatesPerSlot: 1,
      minNoticeHours: 24,
      maxAdvanceDays: 14
    };
  }

  async updateInterviewSettings(userId: string, settings: any) {
    const recruiter = await this.ensureRecruiter(userId);
    
    // Validate and merge settings
    const currentSettings: any = (recruiter as any).interviewSettings || {};
    const newSettings = {
      defaultLocation: settings.defaultLocation ?? currentSettings.defaultLocation ?? '',
      timeSlots: settings.timeSlots ?? currentSettings.timeSlots ?? ['08:00', '10:00', '14:00', '16:00'],
      blockedDates: settings.blockedDates ?? currentSettings.blockedDates ?? [],
      maxCandidatesPerSlot: settings.maxCandidatesPerSlot ?? currentSettings.maxCandidatesPerSlot ?? 1,
      minNoticeHours: settings.minNoticeHours ?? currentSettings.minNoticeHours ?? 24,
      maxAdvanceDays: settings.maxAdvanceDays ?? currentSettings.maxAdvanceDays ?? 14
    };

    // Update recruiter
    await this.prisma.recruiter.update({
      where: { recruiterId: recruiter.recruiterId },
      data: { interviewSettings: newSettings } as any
    });

    // Check if we need to cancel interviews due to blocked dates
    if (settings.blockedDates && Array.isArray(settings.blockedDates)) {
      await this.cancelInterviewsOnBlockedDates(recruiter.recruiterId, settings.blockedDates);
    }

    return { success: true, settings: newSettings };
  }

  private async cancelInterviewsOnBlockedDates(recruiterId: string, blockedDates: string[]) {
    if (!blockedDates.length) return;

    for (const dateStr of blockedDates) {
      const blockDate = new Date(dateStr);
      if (isNaN(blockDate.getTime())) continue;

      const startOfDay = new Date(blockDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(blockDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all interviewing applications on this date for this recruiter
      const affectedApps = await this.prisma.application.findMany({
        where: {
          appStatus: { in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED'] },
          jobPosting: { recruiterId },
          interviewDate: { gte: startOfDay, lte: endOfDay }
        },
        include: { candidate: { include: { user: true } }, jobPosting: { include: { recruiter: true } } }
      });

      for (const app of affectedApps) {
        await this.prisma.application.update({
          where: { applicationId: app.applicationId },
          data: {
            appStatus: 'RESCHEDULE_REQUESTED'
          }
        });

        // Send a message to the candidate
        if (app.jobPosting.recruiter?.userId) {
          try {
            const content = `[Hệ thống Workly] Xin lỗi bạn, nhà tuyển dụng có việc đột xuất nên không thể phỏng vấn vào ngày ${dateStr.split('-').reverse().join('/')}. Bạn vui lòng chọn lại một lịch phỏng vấn khác nhé!`;
            
            const conv = await this.messagesService.createConversation(
              app.candidateId,
              app.jobPosting.recruiterId!
            );
            
            const savedMessage = await this.messagesService.sendMessage(
              app.jobPosting.recruiter.userId, 
              conv.conversationId,
              content,
              true
            );

            // Emit newMessage to both parties
            this.messagesGateway.server.to(`user_${app.candidate.userId}`).emit('newMessage', savedMessage);
            this.messagesGateway.server.to(`user_${app.jobPosting.recruiter.userId}`).emit('newMessage', savedMessage);

            // Emit notification to candidate to refresh applications and show "Chọn lịch ngay" banner
            this.messagesGateway.server.to(`user_${app.candidate.userId}`).emit('notification');

            
            const userEmail = (app.candidate as any).user?.email;
            if (userEmail) {
              const formattedDateStr = dateStr.split('-').reverse().join('/');
              await this.mailService.sendInterviewRescheduleRequest(
                userEmail,
                app.candidate.fullName,
                formattedDateStr
              );
            }
          } catch (err) {
            // Ignore error
          }
        }
      }
    }
  }

  async getMatchedCandidates(userId: string, jobId: string) {
    const recruiter = await this.ensureRecruiter(userId);

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      select: { status: true, structuredRequirements: true },
    });

    if (job?.status === 'REJECTED') {
      return [];
    }

    const dbMatches = await this.prisma.jobMatch.findMany({
      where: { jobPostingId: jobId },
      orderBy: { score: 'desc' },
      include: {
        candidate: {
          select: { cvs: { where: { isMain: true }, select: { cvId: true } } },
        },
      },
    });

    const matches = dbMatches.map((m) => ({
      candidateId: m.candidateId,
      score: m.score,
      matchedSkills: m.matchedSkills,
      cvId: m.candidate?.cvs?.[0]?.cvId,
      matchDetails: m.details as any,
    }));

    // Lấy danh sách đã mở khóa
    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId, jobPostingId: jobId },
      select: { candidateId: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

    // Lấy thông tin chi tiết ứng viên và Masking
    const enrichedMatches = await Promise.all(
      matches.map(async (m) => {
        const unlockInfo = (await this.prisma.candidateUnlock.findUnique({
          where: {
            recruiterId_candidateId_jobPostingId: {
              recruiterId: recruiter.recruiterId,
              candidateId: m.candidateId,
              jobPostingId: jobId,
            },
          },
        })) as any;

        const isUnlocked = !!unlockInfo;
        // Nếu đã mở khóa, lấy đúng CV đã được mở khóa, nếu chưa thì lấy CV match tốt nhất (m.cvId)
        const targetCvId = isUnlocked ? unlockInfo.cvId : m.cvId;

        const [candidate, cv] = await Promise.all([
          this.prisma.candidate.findUnique({
            where: { candidateId: m.candidateId },
            include: {
              user: {
                select: { avatar: true, email: true, phoneNumber: true },
              },
            },
          }),
          this.prisma.cV.findUnique({
            where: { cvId: targetCvId },
            select: { parsedData: true, fileUrl: true },
          }),
        ]);

        let backendCvUrl = cv?.fileUrl;
        // Convert internal path to full URL if needed (same logic as used in other areas)
        if (
          backendCvUrl &&
          !backendCvUrl.startsWith('http') &&
          !backendCvUrl.startsWith('/api/')
        ) {
          backendCvUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/uploads/${backendCvUrl}`;
        } else if (backendCvUrl && backendCvUrl.startsWith('/uploads/')) {
          backendCvUrl = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api${backendCvUrl}`;
        }

        const jobReqs = (job?.structuredRequirements as any) || {};
        const hardSkills = Array.isArray(jobReqs?.hardSkills)
          ? jobReqs.hardSkills
          : [];
        const missingSkills = hardSkills.filter(
          (s: string) =>
            !m.matchedSkills.some((ms: string) =>
              ms.toLowerCase().includes(s.toLowerCase()),
            ),
        );
        const cvExp = candidate?.totalYearsExp || 0;
        const requiredExp = jobReqs?.minExperienceYears || 0;

        return {
          ...m,
          fullName: isUnlocked
            ? candidate?.fullName || 'Ứng viên'
            : `Ứng viên #${m.candidateId.slice(0, 4)}`,
          avatar: isUnlocked ? candidate?.user?.avatar : null,
          email: isUnlocked ? candidate?.user?.email : '****@***.com',
          phone: isUnlocked ? candidate?.user?.phoneNumber : '****-***-***',
          isUnlocked,
          cvUrl: isUnlocked ? backendCvUrl : null,
          skills: (cv?.parsedData as any)?.skills || [],
          missingSkills,
          analysis: {
            hardSkillsCount: hardSkills.length,
            matchedCount: hardSkills.length - missingSkills.length,
            missingCount: missingSkills.length,
            experienceMatch: cvExp >= requiredExp,
            totalYearsExp: cvExp,
            requiredExp: requiredExp,
            ...(m.matchDetails || {}),
          },
        };
      }),
    );

    return enrichedMatches;
  }

  async getDashboardData(userId: string, targetDate?: string) {
    const recruiter = await this.ensureRecruiter(userId);

    const recruiterId = recruiter.recruiterId;

    // 1. Lấy tổng số tin tuyển dụng đang mở
    const activeJobsCount = await this.prisma.jobPosting.count({
      where: {
        recruiterId,
        status: 'APPROVED',
      },
    });

    // 2. Lấy tổng số ứng viên đã nộp vào tất cả các Job của nhà tuyển dụng này
    const totalApplicantsCount = await this.prisma.application.count({
      where: {
        jobPosting: {
          recruiterId,
        },
      },
    });

    // 3. Lấy số lượng Hộp thoại chưa đọc từ MessagesService (để đồng bộ với Sidebar badge)
    const { unreadCount: newMessagesCount } =
      await this.messagesService.getUnreadCount(userId);

    // 4. Lấy tổng số lượt xem JD
    // Chạy tổng bằng hàm aggregate của Prisma trên mảng JobPosting của Recruiter này
    const viewsAggregate = await this.prisma.jobPosting.aggregate({
      where: { recruiterId },
      _sum: {
        viewCount: true,
      },
    });
    const totalJDViews = viewsAggregate._sum?.viewCount || 0;

    // 5. Lấy một vài Job mới nhất kèm thống kê ứng viên
    const recentJobs = await this.prisma.jobPosting.findMany({
      where: { recruiterId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    // 6. Lấy lịch phỏng vấn sắp tới (Mặc định 7 ngày tới)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const next7Days = new Date(startOfToday);
    next7Days.setDate(next7Days.getDate() + 7);
    next7Days.setHours(23, 59, 59, 999);

    let interviewDateCondition: any = {
      gte: startOfToday,
      lte: next7Days,
    };

    if (targetDate) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOf7Days = new Date(startOfDay);
      endOf7Days.setDate(endOf7Days.getDate() + 6);
      endOf7Days.setHours(23, 59, 59, 999);
      interviewDateCondition = {
        gte: startOfDay,
        lte: endOf7Days,
      };
    }

    const upcomingInterviews = await this.prisma.application.findMany({
      where: {
        jobPosting: { recruiterId },
        NOT: { interviewDate: null },
        interviewDate: interviewDateCondition,
      },
      orderBy: [{ interviewDate: 'asc' }, { interviewTime: 'asc' }],
      take: 20,
      include: {
        candidate: { select: { fullName: true, candidateId: true } },
        jobPosting: { select: { title: true } },
      },
    });

    return {
      stats: {
        activeJobsCount,
        totalApplicantsCount,
        newMessagesCount,
        totalJDViews,
      },
      recentJobs: recentJobs.map((job) => ({
        id: job.jobPostingId,
        title: job.title,
        applicants: job._count.applications,
        status: job.status,
        date: job.createdAt,
      })),
      upcomingInterviews: upcomingInterviews.map((app) => ({
        id: app.applicationId,
        candidateName: app.candidate?.fullName || 'Ứng viên',
        jobTitle: app.jobPosting?.title || 'Công việc',
        time: app.interviewTime,
        date: app.interviewDate,
        location: app.interviewLocation,
        status: app.appStatus,
      })),
    };
  }

  async getTopMatchesForAllJobs(userId: string) {
    const recruiter = await this.ensureRecruiter(userId);

    const activeJobs = await this.prisma.jobPosting.findMany({
      where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
      select: { jobPostingId: true, title: true, structuredRequirements: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    const allMatches: any[] = [];
    for (const job of activeJobs) {
      const dbMatches = await this.prisma.jobMatch.findMany({
        where: { jobPostingId: job.jobPostingId },
        orderBy: { score: 'desc' },
        include: {
          candidate: {
            select: {
              cvs: {
                where: { isMain: true },
                select: { cvId: true, parsedData: true },
              },
            },
          },
        },
      });
      const matches = dbMatches.map((m) => {
        const jobReqs = (job?.structuredRequirements as any) || {};
        const hardSkills = Array.isArray(jobReqs?.hardSkills)
          ? jobReqs.hardSkills
          : [];
        const missingSkills = hardSkills.filter(
          (s: string) =>
            !m.matchedSkills.some((ms: string) =>
              ms.toLowerCase().includes(s.toLowerCase()),
            ),
        );
        const cvExp =
          (m.candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp || 0;
        const requiredExp = jobReqs?.minExperienceYears || 0;

        return {
          candidateId: m.candidateId,
          score: m.score,
          matchedSkills: m.matchedSkills,
          cvId: m.candidate?.cvs?.[0]?.cvId,
          missingSkills,
          analysis: {
            hardSkillsCount: hardSkills.length,
            matchedCount: hardSkills.length - missingSkills.length,
            missingCount: missingSkills.length,
            experienceMatch: cvExp >= requiredExp,
            totalYearsExp: cvExp,
            requiredExp: requiredExp,
            ...((m.details as any) || {}),
          },
        };
      });
      allMatches.push(...matches.map((m) => ({ ...m, jobTitle: job.title })));
    }

    // Sort by score and take top 4
    const top4 = allMatches.sort((a, b) => b.score - a.score).slice(0, 4);

    // Lấy danh sách đã mở khóa
    const unlockedIds = new Set();
    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
      select: { candidateId: true },
    });
    unlocked.forEach((u) => unlockedIds.add(u.candidateId));

    // Enrich with candidate details (Masked)
    return Promise.all(
      top4.map(async (m) => {
        const isUnlocked = unlockedIds.has(m.candidateId);
        const candidate = await this.prisma.candidate.findUnique({
          where: { candidateId: m.candidateId },
          include: { user: { select: { avatar: true } } },
        });
        const cv = await this.prisma.cV.findUnique({
          where: { cvId: m.cvId },
          select: { parsedData: true },
        });

        return {
          ...m,
          fullName: isUnlocked
            ? candidate?.fullName || 'Ứng viên'
            : `Ứng viên #${m.candidateId.slice(0, 4)}`,
          avatar: isUnlocked ? candidate?.user?.avatar : null,
          skills: (cv?.parsedData as any)?.skills || [],
        };
      }),
    );
  }

  async getMatchSummary(userId: string) {
    const recruiter = await this.ensureRecruiter(userId);

    const totalMatches = await this.prisma.jobMatch.count({
      where: {
        jobPosting: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
        score: { gte: 70 }, // threshold for highlighting
      },
    });

    const activeJobsCount = await this.prisma.jobPosting.count({
      where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
    });

    return { totalMatches, activeJobsCount };
  }
}
