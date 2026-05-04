import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiService } from '@/modules/intelligence/ai/ai.service';
import { SubscriptionsService } from '@/modules/billing/subscriptions/subscriptions.service';

import { JobCategoryService } from './services/job-category.service';
import { JobModerationService } from './services/job-moderation.service';
import { JobSearchService } from './services/job-search.service';
import { JobNotificationService } from './services/job-notification.service';
import { JobLifecycleService } from './services/job-lifecycle.service';
import { JobRecommendationService } from './services/job-recommendation.service';
import { JobAdminService } from './services/job-admin.service';
import { JobManagementService } from './services/job-management.service';

@Injectable()
export class JobPostingsService {
  private readonly logger = new Logger(JobPostingsService.name);

  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    @InjectQueue('matching') private matchingQueue: Queue,
    private aiService: AiService,
    private subscriptionsService: SubscriptionsService,
    private jobCategoryService: JobCategoryService,
    private jobModerationService: JobModerationService,
    private jobSearchService: JobSearchService,
    private jobNotificationService: JobNotificationService,
    private lifecycleService: JobLifecycleService,
    private recommendationService: JobRecommendationService,
    private adminService: JobAdminService,
    private jobManagementService: JobManagementService,
  ) {}

  async preCheck(createJobPostingDto: CreateJobPostingDto) {
    return this.jobModerationService.preCheck(createJobPostingDto);
  }

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    return this.jobManagementService.create(createJobPostingDto, userId);
  }

  async findAll(query: FilterJobPostingDto, userId?: string) {
    return this.jobSearchService.findAll(query, userId);
  }

  async findMyJobs(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const jobs = await this.prisma.jobPosting.findMany({
      where: { recruiterId: recruiter.recruiterId },
      include: {
        applications: true,
        branches: { include: { branch: true } },
      },
      orderBy: { refreshedAt: 'desc' },
    });

    const jobIds = jobs.map((j) => j.jobPostingId);
    const [allMatches, allUnlocks] = await Promise.all([
      this.prisma.jobMatch.findMany({
        where: { jobPostingId: { in: jobIds }, score: { gte: 60 } },
        select: { jobPostingId: true, score: true },
      }),
      this.prisma.candidateUnlock.findMany({
        where: {
          jobPostingId: { in: jobIds },
          recruiterId: recruiter.recruiterId,
        },
        include: {
          cv: {
            include: {
              candidate: { include: { user: { select: { avatar: true } } } },
            },
          },
        },
        orderBy: { unlockedAt: 'desc' },
      }),
    ]);

    const matchesByJob = allMatches.reduce(
      (acc, m) => {
        acc[m.jobPostingId] = (acc[m.jobPostingId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const unlocksByJob = allUnlocks.reduce(
      (acc, u) => {
        if (!acc[u.jobPostingId]) acc[u.jobPostingId] = [];
        if (acc[u.jobPostingId].length < 5) {
          acc[u.jobPostingId].push({
            candidateId: u.candidateId,
            fullName: u.cv.candidate.fullName,
            avatar: u.cv.candidate.user.avatar,
            unlockedAt: u.unlockedAt,
          });
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );

    return jobs.map((job) => ({
      ...job,
      matchedCount: matchesByJob[job.jobPostingId] || 0,
      autoInvitedCandidates: unlocksByJob[job.jobPostingId] || [],
      branches: (job as any).branches.map((b: any) => b.branch),
    }));
  }

  async findOne(id: string, userId?: string, trackView: boolean = true) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      );
    const job = await this.prisma.jobPosting.findFirst({
      where: isUuid ? { jobPostingId: id } : { slug: id },
      include: {
        company: true,
        recruiter: true,
        branches: { include: { branch: true } },
        applications: { select: { applicationId: true } },
      },
    });

    if (!job)
      throw new NotFoundException(`Không tìm thấy Job với ID/Slug ${id}`);

    const flattenedJob: any = {
      ...job,
      branches: (job as any).branches.map((b: any) => b.branch),
    };

    if (trackView && userId && flattenedJob.recruiter?.userId !== userId) {
      this.prisma.jobPosting
        .update({
          where: { jobPostingId: flattenedJob.jobPostingId },
          data: { viewCount: { increment: 1 } },
        })
        .then(() => {
          if (flattenedJob.recruiter?.userId) {
            this.messagesGateway.server
              .to(`user_${flattenedJob.recruiter.userId}`)
              .emit('jdViewUpdated', {
                jobPostingId: flattenedJob.jobPostingId,
              });
          }
        })
        .catch(this.logger.error);
    }

    let hasApplied = false;
    let isSaved = false;
    let matchScore: number | null = null;

    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        const [app, saved, match] = await Promise.all([
          this.prisma.application.findFirst({
            where: {
              jobPostingId: job.jobPostingId,
              candidateId: candidate.candidateId,
            },
          }),
          this.prisma.savedJob.findUnique({
            where: {
              candidateId_jobPostingId: {
                candidateId: candidate.candidateId,
                jobPostingId: job.jobPostingId,
              },
            },
          }),
          this.prisma.jobMatch.findUnique({
            where: {
              candidateId_jobPostingId: {
                candidateId: candidate.candidateId,
                jobPostingId: job.jobPostingId,
              },
            },
          }),
        ]);
        hasApplied = !!app;
        isSaved = !!saved;
        matchScore = match?.score || null;
      }
    }

    return { ...flattenedJob, hasApplied, isSaved, matchScore };
  }

  getIndustries() {
    return this.jobCategoryService.getHierarchicalIndustries();
  }

  async syncAllCategories() {
    return this.jobCategoryService.syncAllCategories();
  }

  async getCategoryStats() {
    return [];
  }

  async update(
    id: string,
    updateJobPostingDto: UpdateJobPostingDto,
    userId: string,
  ) {
    return this.jobManagementService.update(id, updateJobPostingDto, userId);
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    adminId: string,
    reason?: string,
  ) {
    return this.adminService.updateStatus(id, status, adminId, reason);
  }

  async updateStatusBulk(ids: string[], status: JobStatus, adminId: string) {
    return this.adminService.updateStatusBulk(ids, status, adminId);
  }

  async removeBulk(ids: string[]) {
    return this.adminService.removeBulk(ids);
  }

  async remove(id: string) {
    await this.prisma.jobPosting.delete({ where: { jobPostingId: id } });
    return { success: true };
  }

  async suggestCategories(
    title: string,
    description?: string,
    skills?: string[],
  ) {
    return this.jobCategoryService.identifyCategories(
      title,
      description,
      skills,
    );
  }

  async syncAllJobsToES() {
    return this.jobSearchService.syncAllJobsToES();
  }

  async getAdminStats() {
    return this.adminService.getAdminStats();
  }

  async findAllAdmin(query: AdminFilterJobPostingDto) {
    return this.adminService.findAllAdmin(query);
  }

  async getSuggestedCandidates(
    jobId: string,
    recruiterUserIdFromToken?: string,
  ) {
    return this.recommendationService.getSuggestedCandidates(
      jobId,
      recruiterUserIdFromToken,
    );
  }

  async getRecommendations(userId: string) {
    return this.recommendationService.getRecommendations(userId);
  }

  async reparse(id: string, userId: string) {
    return this.lifecycleService.reparse(id, userId);
  }

  async renew(jobId: string, userId: string) {
    return this.lifecycleService.renew(jobId, userId);
  }

  async pause(id: string, userId: string) {
    return this.lifecycleService.pause(id, userId);
  }

  async resume(id: string, userId: string) {
    return this.lifecycleService.resume(id, userId);
  }

  async close(id: string, userId: string) {
    return this.lifecycleService.close(id, userId);
  }

  async bulkPause(ids: string[], userId: string) {
    const results = await Promise.all(
      ids.map((id) => this.lifecycleService.pause(id, userId)),
    );
    return { count: results.length };
  }

  async bulkResume(ids: string[], userId: string) {
    const results = await Promise.all(
      ids.map((id) => this.lifecycleService.resume(id, userId)),
    );
    return { count: results.length };
  }

  async bulkClose(ids: string[], userId: string) {
    const results = await Promise.all(
      ids.map((id) => this.lifecycleService.close(id, userId)),
    );
    return { count: results.length };
  }
}
