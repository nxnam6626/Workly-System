import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CandidateInteractionService {
  private readonly logger = new Logger(CandidateInteractionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async toggleSave(candidateId: string, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const { savedCandidateIds } = recruiter;
    const isSaved = savedCandidateIds.includes(candidateId);

    const newSavedCandidateIds = isSaved
      ? savedCandidateIds.filter((id) => id !== candidateId)
      : [...savedCandidateIds, candidateId];

    await this.prisma.recruiter.update({
      where: { userId },
      data: { savedCandidateIds: newSavedCandidateIds },
    });

    return { saved: !isSaved, candidateId };
  }

  async getSavedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const savedCandidates = await this.prisma.candidate.findMany({
      where: { candidateId: { in: recruiter.savedCandidateIds } },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        cvs: {
          select: {
            cvId: true,
            cvTitle: true,
            fileUrl: true,
            isMain: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    });

    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
      select: { candidateId: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

    return savedCandidates.map((candidate) => {
      const isUnlocked = unlockedIds.has(candidate.candidateId);
      return {
        ...candidate,
        fullName: isUnlocked
          ? candidate.fullName
          : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
        user: {
          ...candidate.user,
          avatar: isUnlocked ? candidate.user?.avatar : null,
          email: isUnlocked ? candidate.user?.email : '****@***.com',
          phoneNumber: isUnlocked
            ? candidate.user?.phoneNumber
            : '****-***-***',
        },
        isUnlocked,
      };
    });
  }

  async getMyInvitations(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate) {
      return [];
    }

    // Find all conversations belonging to the candidate
    const conversations = await this.prisma.conversation.findMany({
      where: { candidateId: candidate.candidateId },
      include: {
        recruiter: {
          include: {
            company: true,
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
        },
      },
    });

    // Gather all candidate matching criteria from messages
    const slugOrIdSet = new Set<string>();
    const titleAndCompanyPairs: { title: string; companyId: string }[] = [];
    const messageDetails: {
      msgId: string;
      content: string;
      sentAt: Date;
      invType: 'INTERVIEW' | 'JOB_APPLICATION';
      slugOrId?: string;
      titleInQuotes?: string;
      companyId?: string;
    }[] = [];

    for (const conv of conversations) {
      for (const msg of conv.messages) {
        const isInvitation = msg.content.includes('mời ứng tuyển') || 
                             msg.content.includes('mời bạn ứng tuyển') ||
                             msg.content.includes('/jobs/') || 
                             msg.content.includes('yêu cầu phỏng vấn') || 
                             msg.content.includes('lịch phỏng vấn');
                             
        if (isInvitation) {
          const isInterview = msg.content.includes('phỏng vấn') || 
                             msg.content.includes('lịch hẹn phỏng vấn') || 
                             msg.content.includes('yêu cầu phỏng vấn');
          const invType = isInterview ? 'INTERVIEW' : 'JOB_APPLICATION';

          const match = msg.content.match(/\/jobs\/([a-zA-Z0-9\-]+)/);
          if (match && match[1]) {
            const slugOrId = match[1];
            slugOrIdSet.add(slugOrId);
            messageDetails.push({
              msgId: msg.messageId,
              content: msg.content,
              sentAt: msg.sentAt,
              invType,
              slugOrId,
            });
          } else {
            const titleMatch = msg.content.match(/["'“]([^"'延“”]+)["'”]/);
            // Fallback match job title inside quotes (supporting multiple quotation mark styles)
            const backupMatch = titleMatch || msg.content.match(/["'“]([^"'“”]+)["'”]/);
            if (backupMatch && backupMatch[1] && conv.recruiter.company?.companyId) {
              const jobTitle = backupMatch[1].trim();
              titleAndCompanyPairs.push({ title: jobTitle, companyId: conv.recruiter.company.companyId });
              messageDetails.push({
                msgId: msg.messageId,
                content: msg.content,
                sentAt: msg.sentAt,
                invType,
                titleInQuotes: jobTitle,
                companyId: conv.recruiter.company.companyId,
              });
            }
          }
        }
      }
    }

    // Fetch jobs by slug/ID in bulk
    const slugOrIds = Array.from(slugOrIdSet);
    const jobsBySlugOrId = slugOrIds.length > 0
      ? await this.prisma.jobPosting.findMany({
          where: {
            OR: [
              { jobPostingId: { in: slugOrIds } },
              { slug: { in: slugOrIds } },
            ],
          },
          include: { company: true },
        })
      : [];

    // Fetch jobs by title and companyId in bulk
    const jobsByTitleAndCompany = titleAndCompanyPairs.length > 0
      ? await this.prisma.jobPosting.findMany({
          where: {
            OR: titleAndCompanyPairs.map(pair => ({
              title: { equals: pair.title, mode: 'insensitive' },
              companyId: pair.companyId,
            })),
          },
          include: { company: true },
        })
      : [];

    // Combine all unique matched jobs
    const allJobs = [...jobsBySlugOrId, ...jobsByTitleAndCompany];
    const jobMap = new Map<string, any>(); // key: slugOrId or title_companyId -> job
    for (const job of allJobs) {
      jobMap.set(job.jobPostingId, job);
      if (job.slug) jobMap.set(job.slug, job);
      if (job.companyId) {
        jobMap.set(`${job.title.toLowerCase()}_${job.companyId}`, job);
      }
    }

    // Fetch all applications for these jobs in bulk (eliminating N+1)
    const matchedJobIds = Array.from(new Set(allJobs.map(job => job.jobPostingId)));
    const applications = matchedJobIds.length > 0
      ? await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: matchedJobIds },
          },
          select: { jobPostingId: true },
        })
      : [];
    const appliedJobIds = new Set(applications.map(app => app.jobPostingId));

    // Map matched jobs and applications back to the message details
    const realInvitations: any[] = [];
    const addedJobIds = new Set<string>();

    for (const detail of messageDetails) {
      let matchedJob: any = null;
      if (detail.slugOrId) {
        matchedJob = jobMap.get(detail.slugOrId);
      } else if (detail.titleInQuotes && detail.companyId) {
        matchedJob = jobMap.get(`${detail.titleInQuotes.toLowerCase()}_${detail.companyId}`);
      }

      if (matchedJob && !addedJobIds.has(matchedJob.jobPostingId)) {
        addedJobIds.add(matchedJob.jobPostingId);
        const hasApplied = appliedJobIds.has(matchedJob.jobPostingId);

        realInvitations.push({
          invitationId: detail.msgId,
          invType: detail.invType,
          jobPostingId: matchedJob.jobPostingId,
          message: detail.content,
          status: hasApplied ? 'ACCEPTED' : 'PENDING',
          createdAt: detail.sentAt.toISOString(),
          jobPosting: {
            title: matchedJob.title,
            salaryMin: matchedJob.salaryMin,
            salaryMax: matchedJob.salaryMax,
            currency: matchedJob.currency,
            locationCity: matchedJob.locationCity,
            jobType: matchedJob.jobType,
            company: {
              companyName: matchedJob.company?.companyName || 'Nhà Tuyển Dụng',
              logo: matchedJob.company?.logo || null,
              industry: matchedJob.company?.mainIndustry || null,
            },
          },
        });
      }
    }

    return realInvitations;
  }
}
