import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';

@Injectable()
export class RecruitersService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
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
      include: { candidate: { select: { cvs: { where: { isMain: true }, select: { cvId: true } } } } }
    });

    const matches = dbMatches.map(m => ({
      candidateId: m.candidateId,
      score: m.score,
      matchedSkills: m.matchedSkills,
      cvId: m.candidate?.cvs?.[0]?.cvId
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
        const hardSkills = Array.isArray(jobReqs?.hardSkills) ? jobReqs.hardSkills : [];
        const missingSkills = hardSkills.filter((s: string) => 
          !m.matchedSkills.some((ms: string) => ms.toLowerCase().includes(s.toLowerCase()))
        );
        const cvExp = (cv?.parsedData as any)?.totalYearsExp || 0;
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
            requiredExp: requiredExp
          }
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

    // 6. Lấy lịch phỏng vấn sắp tới
    let interviewDateCondition: any = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
    if (targetDate) {
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      interviewDateCondition = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    const upcomingInterviews = await this.prisma.application.findMany({
      where: {
        jobPosting: { recruiterId },
        NOT: { interviewDate: null },
        interviewDate: interviewDateCondition
      },
      orderBy: [
        { interviewDate: 'asc' },
        { interviewTime: 'asc' }
      ],
      take: 5,
      include: {
        candidate: { select: { fullName: true, candidateId: true } },
        jobPosting: { select: { title: true } }
      }
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
        include: { candidate: { select: { cvs: { where: { isMain: true }, select: { cvId: true, parsedData: true } } } } }
      });
      const matches = dbMatches.map(m => {
        const jobReqs = (job?.structuredRequirements as any) || {};
        const hardSkills = Array.isArray(jobReqs?.hardSkills) ? jobReqs.hardSkills : [];
        const missingSkills = hardSkills.filter((s: string) => 
          !m.matchedSkills.some((ms: string) => ms.toLowerCase().includes(s.toLowerCase()))
        );
        const cvExp = (m.candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp || 0;
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
            requiredExp: requiredExp
          }
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
      })
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
      where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' }
    });

    return { totalMatches, activeJobsCount };
  }
}
