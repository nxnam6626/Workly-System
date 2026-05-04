import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';
import { UpdateJobPostingDto } from '../dto/update-job-posting.dto';
import { JobModerationService } from './job-moderation.service';
import { JobCategoryService } from './job-category.service';
import { JobSearchService } from './job-search.service';
import { JobNotificationService } from './job-notification.service';
import { SubscriptionsService } from '@/modules/billing/subscriptions/subscriptions.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';

@Injectable()
export class JobManagementService {
  private readonly logger = new Logger(JobManagementService.name);

  constructor(
    private prisma: PrismaService,
    private jobModerationService: JobModerationService,
    private jobCategoryService: JobCategoryService,
    private jobSearchService: JobSearchService,
    private jobNotificationService: JobNotificationService,
    private subscriptionsService: SubscriptionsService,
    private messagesGateway: MessagesGateway,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) {}

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { company: true },
    });

    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException(
        'Thông tin nhà tuyển dụng hoặc công ty chưa được thiết lập.',
      );
    }

    const {
      deadline,
      salaryMin,
      salaryMax,
      hardSkills,
      softSkills,
      minExperienceYears,
      jobTier,
      jobLevel,
      branchIds,
      isAiGenerated,
      categories: providedCategories,
      ...rest
    } = createJobPostingDto as any;

    const finalJobLevel = jobLevel && jobLevel !== '' ? jobLevel : 'STAFF';
    delete rest.crawlSourceId;

    const baseSlug = createJobPostingDto.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const generatedSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;

    const requestedJobTier = jobTier || 'BASIC';
    await this.subscriptionsService.checkPermissionAndDeduct(
      userId,
      requestedJobTier,
    );

    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      throw new ForbiddenException(
        'Lương tối thiểu không thể lớn hơn lương tối đa.',
      );
    }

    const modResult =
      await this.jobModerationService.preCheck(createJobPostingDto);
    let finalStatus: JobStatus = JobStatus.PENDING;

    if (!modResult.safe || modResult.score < 50)
      finalStatus = JobStatus.REJECTED;
    else if (modResult.score < 70) finalStatus = JobStatus.PENDING;
    else finalStatus = JobStatus.APPROVED;

    const categories =
      providedCategories ||
      this.jobCategoryService.identifyCategories(
        createJobPostingDto.title,
        createJobPostingDto.description,
        hardSkills,
      );

    const job = await this.prisma.jobPosting.create({
      data: {
        ...rest,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        status: finalStatus,
        jobTier: requestedJobTier,
        jobLevel: finalJobLevel,
        isVerified: finalStatus === 'APPROVED',
        aiReliabilityScore: modResult.score,
        slug: generatedSlug,
        moderationFeedback: modResult,
        structuredRequirements: {
          hardSkills: hardSkills || [],
          softSkills: softSkills || [],
          minExperienceYears: minExperienceYears || 0,
          vacancies: (createJobPostingDto as any).vacancies || 1,
          isAiGenerated: isAiGenerated === true,
          categories,
        },
        branches: {
          create: branchIds?.map((id: string) => ({ branchId: id })) || [],
        },
      },
      include: {
        company: true,
        recruiter: { include: { user: { select: { email: true } } } },
      },
    });

    if (finalStatus === JobStatus.REJECTED && recruiter.recruiterId) {
      await this.jobModerationService.checkAndAutoLockRecruiter(
        recruiter.recruiterId,
      );
    }

    if (finalStatus === 'APPROVED') {
      this.jobSearchService.syncJobToES(job);
      await this.matchingQueue.add('match', { jobId: job.jobPostingId });
      this.jobNotificationService.triggerJobNotifications(job);
      if (requestedJobTier === 'URGENT')
        this.jobNotificationService.pushUrgentNotifications(job);

      await this.jobNotificationService.sendStatusNotification(
        userId,
        'Tin tuyển dụng được duyệt tự động',
        `Tin tuyển dụng "${job.title}" của bạn đã được hệ thống AI tự động phê duyệt an toàn.`,
        'success',
        '/recruiter/jobs',
      );
    } else if (finalStatus === 'REJECTED') {
      await this.jobNotificationService.sendStatusNotification(
        userId,
        'Tin tuyển dụng bị từ chối tự động',
        `Tin tuyển dụng "${job.title}" của bạn đã bị từ chối do vi phạm quy định.`,
        'error',
        '/recruiter/jobs',
      );
    }

    this.messagesGateway.server.emit('adminJobUpdated');
    return job;
  }

  async update(
    id: string,
    updateJobPostingDto: UpdateJobPostingDto,
    userId: string,
  ) {
    const existingJob = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { recruiter: true },
    });
    if (!existingJob)
      throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);
    if (existingJob.recruiter?.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa tin này');

    const {
      branchIds,
      hardSkills,
      softSkills,
      minExperienceYears,
      isAiGenerated,
      expandedSkills,
      categories: providedCategories,
      ...rest
    } = updateJobPostingDto as any;

    const modResult = await this.jobModerationService.preCheck({
      ...existingJob,
      ...updateJobPostingDto,
    } as any);

    let newStatus: JobStatus =
      (updateJobPostingDto as any).status || existingJob.status;
    if (modResult.score < 50) newStatus = JobStatus.REJECTED;
    else if (modResult.score < 70) newStatus = JobStatus.PENDING;
    else newStatus = JobStatus.APPROVED;

    const currentStructured = (existingJob.structuredRequirements as any) || {};
    const categories =
      providedCategories ||
      this.jobCategoryService.identifyCategories(
        updateJobPostingDto.title || existingJob.title,
        updateJobPostingDto.description || existingJob.description || '',
        hardSkills || currentStructured.hardSkills || [],
      );

    const result = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...rest,
        status: newStatus,
        structuredRequirements: {
          ...currentStructured,
          ...(hardSkills !== undefined && { hardSkills }),
          ...(softSkills !== undefined && { softSkills }),
          ...(minExperienceYears !== undefined && { minExperienceYears }),
          ...(isAiGenerated !== undefined && { isAiGenerated }),
          ...(expandedSkills !== undefined && { expandedSkills }),
          categories,
        },
        moderationFeedback: modResult,
        aiReliabilityScore: modResult.score,
        ...(newStatus === JobStatus.APPROVED && { isVerified: true }),
        ...(branchIds && {
          branches: {
            deleteMany: {},
            create: branchIds.map((id: string) => ({ branchId: id })),
          },
        }),
      },
      include: { company: true, recruiter: true },
    });

    if (newStatus === JobStatus.REJECTED && result.recruiterId) {
      await this.jobModerationService.checkAndAutoLockRecruiter(
        result.recruiterId,
      );
    }

    if (result.status === JobStatus.APPROVED) {
      this.jobSearchService.syncJobToES(result);
      await this.matchingQueue.add('match', { jobId: id });
    }

    return result;
  }
}
