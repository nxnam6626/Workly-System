import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { JobAlertsService } from '../../job-alerts/job-alerts.service';
import { SearchService } from '../../search/search.service';

@Injectable()
export class JobPostingsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private jobAlertsService: JobAlertsService,
    private searchService: SearchService,
  ) { }

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException('Thông tin nhà tuyển dụng hoặc công ty chưa được thiết lập.');
    }

    const { deadline, salaryMin, salaryMax, ...rest } = createJobPostingDto as any;
    
    // Đảm bảo không còn crawlSourceId lọt vào (nếu có từ decorator cũ hoặc cache)
    delete rest.crawlSourceId;

    // Kiểm tra logic lương
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      throw new ForbiddenException('Lương tối thiểu không thể lớn hơn lương tối đa.');
    }

    // Kiểm tra logic deadline
    if (deadline && deadline < Date.now()) {
      throw new ForbiddenException('Ngày hết hạn không thể là một ngày trong quá khứ.');
    }

    return this.prisma.jobPosting.create({
      data: {
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        postType: 'MANUAL',
        status: 'PENDING',
        isVerified: false,
      },
    });
  }




  async findAll(query: FilterJobPostingDto) {
    const { search, location, jobType, page = 1, limit = 10, industry, experience, salaryMin, salaryMax } = query;
    
    // Use Elasticsearch for searching and filtering IDs
    const { ids, total } = await this.searchService.searchJobs({
      search,
      location,
      jobType,
      industry,
      experience,
      salaryMin,
      salaryMax,
      page,
      limit,
    });

    if (ids.length === 0 && total === 0 && !search) {
      // Fallback or initial state if ES is empty but we have jobs in DB
      // This is helpful if sync hasn't run yet
      return this.findAllPrisma(query);
    }

    if (ids.length === 0) {
      return { items: [], total: 0, page, limit };
    }

    // Fetch full data from Prisma using IDs from ES
    const items = await this.prisma.jobPosting.findMany({
      where: {
        jobPostingId: { in: ids },
      },
      include: {
        company: true,
        recruiter: true,
      },
    });

    // Sort items to match ES order (relevance or custom sort)
    const sortedItems = ids
      .map(id => items.find(item => item.jobPostingId === id))
      .filter(item => !!item);

    return { items: sortedItems, total, page, limit };
  }

  // Backup method using Prisma directly
  private async findAllPrisma(query: FilterJobPostingDto) {
    const { search, location, jobType, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { status: 'APPROVED' };
    if (location) where.locationCity = location;
    if (jobType) where.jobType = jobType;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { company: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string, userId?: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { company: true, recruiter: true },
    });

    if (!job) throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);

    let hasApplied = false;
    let isSaved = false;

    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({ where: { userId } });
      if (candidate) {
        // Check Application
        const application = await this.prisma.application.findFirst({
          where: {
            jobPostingId: id,
            candidateId: candidate.candidateId,
          },
        });
        hasApplied = !!application;

        // Check Saved
        const saved = await this.prisma.savedJob.findUnique({
          where: {
            candidateId_jobPostingId: {
              candidateId: candidate.candidateId,
              jobPostingId: id,
            },
          },
        });
        isSaved = !!saved;
      }
    }

    return { ...job, hasApplied, isSaved };
  }

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    // Kiểm tra tồn tại trước khi update
    await this.findOne(id);

    const { deadline, ...rest } = updateJobPostingDto;

    const result = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...rest,
        ...(deadline && { deadline: new Date(deadline) }),
        updatedAt: new Date(),
      },
      include: { company: true }
    });

    // Update ES if approved
    if (result.status === JobStatus.APPROVED) {
      this.syncJobToES(result);
    } else {
      await this.searchService.deleteJob(id);
    }

    return result;
  }


  async findAllAdmin(query: AdminFilterJobPostingDto) {
    const { status, postType, minAiScore, searchTerm, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (postType) where.postType = postType;
    if (minAiScore !== undefined) where.aiReliabilityScore = { gte: minAiScore };

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: { include: { user: { select: { email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { items, total, page, limit };
  }
  async updateStatus(id: string, status: JobStatus, adminId: string) {
    const updatedJob = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        status,
        approvedBy: adminId, // Reuse approvedBy field to track who approved/rejected
        updatedAt: new Date(),
      },
      include: { company: true },
    });

    if (status === JobStatus.APPROVED) {
      this.triggerJobNotifications(updatedJob);
      this.syncJobToES(updatedJob);
    } else {
      await this.searchService.deleteJob(id);
    }

    return updatedJob;
  }

  private async triggerJobNotifications(job: any) {
    try {
      const alerts = await this.jobAlertsService.findAllAlerts();
      const matchedAlerts = alerts.filter(alert => 
        job.title.toLowerCase().includes(alert.keywords.toLowerCase())
      );

      for (const alert of matchedAlerts) {
        await this.notificationsService.create({
          userId: alert.userId,
          title: 'Việc làm mới theo từ khóa của bạn',
          content: `Có 1 việc làm mới theo từ khóa tìm kiếm ${alert.keywords}. Vào xem ngay`,
          type: 'JOB_ALERT',
          metadata: { jobPostingId: job.jobPostingId },
        });
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
  }

  async removeBulk(query: AdminFilterJobPostingDto) {
    const { status, postType, minAiScore, searchTerm } = query;
    const where: any = {};
    if (status) where.status = status;
    if (postType) where.postType = postType;
    if (minAiScore !== undefined) where.aiReliabilityScore = { gte: minAiScore };

    
    if (searchTerm && searchTerm.includes(',')) {
      where.jobPostingId = { in: searchTerm.split(',') };
    } else if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    // Security check: ensure at least one filter is provided to prevent accidental full wipe
    if (Object.keys(where).length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp ít nhất một bộ lọc để xóa hàng loạt.');
    }

    const result = await this.prisma.jobPosting.deleteMany({ where });
    return { message: `Đã xóa thành công ${result.count} tin tuyển dụng.`, count: result.count };
  }

  async updateStatusBulk(query: AdminFilterJobPostingDto, status: JobStatus, adminId: string) {
    const { status: currentStatus, postType, minAiScore, searchTerm } = query;
    const where: any = {};
    if (currentStatus) where.status = currentStatus;
    if (postType) where.postType = postType;
    if (minAiScore !== undefined) where.aiReliabilityScore = { gte: minAiScore };

    
    // If searchTerm is provided as a comma-separated list of IDs (as the frontend does now)
    if (searchTerm && searchTerm.includes(',')) {
      where.jobPostingId = { in: searchTerm.split(',') };
    } else if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }

    if (Object.keys(where).length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp ít nhất một bộ lọc để thao tác hàng loạt.');
    }

    const result = await this.prisma.jobPosting.updateMany({
      where,
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
      },
    });

    if (status === JobStatus.APPROVED) {
      // For bulk, we need to fetch the actual jobs to match keywords
      const approvedJobs = await this.prisma.jobPosting.findMany({
        where: { ...where, status: JobStatus.APPROVED },
      });
      for (const job of approvedJobs) {
        this.triggerJobNotifications(job);
        this.syncJobToES(job);
      }
    } else {
      // If bulk reject/expire, remove from ES
      const jobsToProcess = await this.prisma.jobPosting.findMany({
        where: { ...where },
      });
      for (const job of jobsToProcess) {
        await this.searchService.deleteJob(job.jobPostingId);
      }
    }

    return { message: `Đã cập nhật trạng thái thành công cho ${result.count} tin tuyển dụng.`, count: result.count };
  }

  async remove(id: string) {
    const job = await this.findOne(id);
    await this.prisma.jobPosting.delete({
      where: { jobPostingId: id },
    });
    await this.searchService.deleteJob(id);
    return { success: true };
  }

  private async syncJobToES(job: any) {
    await this.searchService.indexJob({
      id: job.jobPostingId,
      title: job.title,
      description: job.description,
      companyId: job.companyId,
      companyName: job.company?.companyName || undefined,
      originalUrl: job.originalUrl,
      locationCity: job.locationCity,
      jobType: job.jobType,
      experience: job.experience,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      status: job.status,
      createdAt: job.createdAt,
    });
  }

  async syncAllJobsToES() {
    const jobs = await this.prisma.jobPosting.findMany({
      where: { status: JobStatus.APPROVED },
      include: { company: true }
    });
    
    console.log(`[JobPostingsService] Syncing ${jobs.length} jobs to ES...`);
    for (const job of jobs) {
      await this.syncJobToES(job);
    }
    return { count: jobs.length };
  }
}
