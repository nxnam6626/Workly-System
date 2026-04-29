import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AiService } from '../../../ai/ai.service';
import { SubscriptionsService } from '../../../subscriptions/subscriptions.service';
import { JobSearchService } from './job-search.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobStatus } from '@prisma/client';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class JobLifecycleService {
  private readonly logger = new Logger(JobLifecycleService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private subscriptionsService: SubscriptionsService,
    private jobSearchService: JobSearchService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  async reparse(id: string, userId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { recruiter: true },
    });

    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    if (job.recruiter?.userId !== userId) throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');

    try {
      const hardSkills = await this.aiService.extractFocusSkills(job.title, job.requirements || '');
      const prompt = `Dựa trên văn bản yêu cầu công việc sau, hãy xác định số năm kinh nghiệm tối thiểu yêu cầu. TRẢ VỀ DUY NHẤT 1 CON SỐ. Tiêu đề: ${job.title} Yêu cầu: ${job.requirements}`;
      
      let minExperienceYears = 0;
      const aiResponse = await this.aiService.generateResponse(prompt);
      const match = aiResponse.match(/\d+/);
      if (match) minExperienceYears = parseInt(match[0]);

      const currentStruct = (job.structuredRequirements as any) || {};
      const updatedStruct = { ...currentStruct, hardSkills, minExperienceYears };

      const updatedJob = await this.prisma.jobPosting.update({
        where: { jobPostingId: id },
        data: { structuredRequirements: updatedStruct },
      });

      // Background enrichment
      this.enrichKeywordsInBackground(id, job.title, hardSkills).catch(this.logger.error);
      
      await this.jobSearchService.syncJobToES(updatedJob);
      await this.matchingQueue.add('match', { jobId: id });

      return { success: true, message: 'Đã bóc tách lại dữ liệu thành công', newRequirements: updatedStruct };
    } catch (error) {
      throw new Error('Không thể bóc tách lại dữ liệu lúc này');
    }
  }

  async renew(jobId: string, userId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      include: { recruiter: true },
    });

    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');
    if (job.recruiter?.userId !== userId) throw new ForbiddenException('Bạn không có quyền gia hạn tin này');

    await this.subscriptionsService.checkPermissionAndDeduct(userId, job.jobTier);

    const updatedJob = await this.prisma.jobPosting.update({
      where: { jobPostingId: jobId },
      data: { status: 'APPROVED', createdAt: new Date(), refreshedAt: new Date() },
      include: { company: true, recruiter: { include: { user: true } } },
    });

    await this.jobSearchService.syncJobToES(updatedJob);
    return updatedJob;
  }

  @Cron('0 0 * * *')
  async refreshGrowthJobs() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        status: JobStatus.APPROVED,
        refreshedAt: { lte: fortyEightHoursAgo },
        recruiter: {
          recruiterSubscription: {
            planType: 'GROWTH',
            expiryDate: { gt: new Date() },
          },
        },
      },
      include: { company: true },
    });

    if (jobs.length > 0) {
      const ids = jobs.map((j) => j.jobPostingId);
      await this.prisma.jobPosting.updateMany({
        where: { jobPostingId: { in: ids } },
        data: { refreshedAt: new Date() },
      });
      for (const j of jobs) {
        await this.jobSearchService.syncJobToES(j);
      }
    }
  }

  private async enrichKeywordsInBackground(jobId: string, title: string, hardSkills: string[]) {
    try {
      if (!hardSkills || hardSkills.length === 0) return;
      const expandedSkills = await this.aiService.expandJobKeywords(title, hardSkills);
      if (Object.keys(expandedSkills).length > 0) {
        const job = await this.prisma.jobPosting.findUnique({ where: { jobPostingId: jobId } });
        if (job && job.structuredRequirements) {
          const reqs = job.structuredRequirements as any;
          reqs.expandedSkills = expandedSkills;
          await this.prisma.jobPosting.update({
            where: { jobPostingId: jobId },
            data: { structuredRequirements: reqs },
          });
          await this.matchingQueue.add('match', { jobId });
        }
      }
    } catch (e) {
      this.logger.error('enrichKeywordsInBackground failed:', e);
    }
  }
}
