import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { MessagesGateway } from '../../messages/messages.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { JobAlertsService } from '../../job-alerts/job-alerts.service';
import { SearchService } from '../../search/search.service';

@Injectable()
export class JobPostingsService {
  constructor(

    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
    private jobAlertsService: JobAlertsService,
    private searchService: SearchService,
  ) { }

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { company: true }
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

    const originalUrl = 'manual-' + Date.now() + '-' + Math.round(Math.random() * 1e9);

    const job = await this.prisma.jobPosting.create({
      data: {
        ...rest,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        deadline: deadline ? new Date(deadline) : null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        postType: 'MANUAL',
        status: 'PENDING',
        isVerified: false,
        originalUrl: originalUrl,
      },
      include: { company: true, recruiter: { include: { user: { select: { email: true } } } } }
    });

    // Notify ALL admins about the new job posting
    const admins = await this.prisma.user.findMany({
      where: {
        userRoles: { some: { role: { roleName: 'ADMIN' } } }
      }
    });

    if (admins.length > 0) {
      const title = 'Tin tuyển dụng mới cần duyệt';
      const message = `Nhà tuyển dụng ${recruiter.company?.companyName || 'mới'} vừa đăng tin "${job.title}". Vui lòng kiểm tra và phê duyệt.`;
      
      for (const admin of admins) {
        await this.notificationsService.create(admin.userId, title, message, 'info', '/admin/jobs');
        this.messagesGateway.server.to(`user_${admin.userId}`).emit('notification', { title, message, type: 'info', link: '/admin/jobs' });
        this.messagesGateway.server.to(`user_${admin.userId}`).emit('newJobPosting', job);
      }
    }

    return job;
  }




  async findAll(query: FilterJobPostingDto, userId?: string) {
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
      return this.findAllPrisma(query, userId);
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
    let sortedItems = ids
      .map(id => items.find(item => item.jobPostingId === id))
      .filter(item => !!item) as any[];

    // Add hasApplied status if userId is provided
    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({ where: { userId } });
      if (candidate) {
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: ids },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map(a => a.jobPostingId));
        sortedItems = sortedItems.map(item => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items: sortedItems, total, page, limit };
  }

  // Backup method using Prisma directly
  private async findAllPrisma(query: FilterJobPostingDto, userId?: string) {
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

    let [items, total] = await Promise.all([
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
    ]) as [any[], number];

    // Add hasApplied status if userId is provided
    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({ where: { userId } });
      if (candidate) {
        const jobPostingIds = items.map(item => item.jobPostingId);
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: jobPostingIds },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map(a => a.jobPostingId));
        items = items.map(item => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items, total, page, limit };
  }

  async findMyJobs(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    return this.prisma.jobPosting.findMany({
      where: { recruiterId: recruiter.recruiterId },
      include: {
        applications: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId?: string, trackView: boolean = true) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { company: true, recruiter: true },
    });

    if (!job) throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);

    // Increment view count asynchronously only if trackView is true
    if (trackView) {
      this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: { viewCount: { increment: 1 } },
      select: { jobPostingId: true } // Minimal return
    }).then(() => {
      if (job.recruiter?.userId) {
        this.messagesGateway.server.to(`user_${job.recruiter.userId}`).emit('jdViewUpdated', { jobPostingId: id });
      }
    }).catch(console.error);
    }

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

  async getAdminStats() {
    const [totalPending, totalApproved, totalRejected, totalCrawled] = await Promise.all([
      this.prisma.jobPosting.count({ where: { status: 'PENDING' } }),
      this.prisma.jobPosting.count({ where: { status: 'APPROVED' } }),
      this.prisma.jobPosting.count({ where: { status: 'REJECTED' } }),
      this.prisma.jobPosting.count({ where: { postType: 'CRAWLED' } }),
    ]);
    return { totalPending, totalApproved, totalRejected, totalCrawled };
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
    const job = await this.findOne(id);

    const updated = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
      },
      include: {
        recruiter: true,
        company: true,
      },
    });

    if (updated.recruiter?.userId) {
       let title = '';
       let message = '';
       let type = 'info';

       if (status === JobStatus.APPROVED) {
         title = 'Tin tuyển dụng được duyệt';
         message = `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.`;
         type = 'success';
       } else if (status === JobStatus.REJECTED) {
         title = 'Tin tuyển dụng bị từ chối';
         message = `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
         type = 'error';
       }

       if (title) {
         await this.notificationsService.create(updated.recruiter.userId, title, message, type, '/recruiter/jobs');
         this.messagesGateway.server
            .to(`user_${updated.recruiter.userId}`)
            .emit('notification', { title, message, type, link: '/recruiter/jobs' });
       }
    }

    this.messagesGateway.server.emit('adminJobUpdated');

    return updated;
  }

  async removeBulk(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp danh sách ID để xóa hàng loạt.');
    }

    const result = await this.prisma.jobPosting.deleteMany({
      where: { jobPostingId: { in: ids } }
    });
    this.messagesGateway.server.emit('adminJobUpdated');
    return { message: `Đã xóa thành công ${result.count} tin tuyển dụng.`, count: result.count };
  }

  async updateStatusBulk(ids: string[], status: JobStatus, adminId: string) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp danh sách ID để thao tác hàng loạt.');
    }

    const where = { jobPostingId: { in: ids } };

    // Find all affected jobs before update to send notifications
    const jobsToUpdate = await this.prisma.jobPosting.findMany({
      where,
      include: { recruiter: true }
    });

    const result = await this.prisma.jobPosting.updateMany({
      where,
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
      },
    });

    // Notifications for Bulk Update
    for (const job of jobsToUpdate) {
        if (job.recruiter?.userId) {
            let title = '';
            let message = '';
            let type = 'info';

            if (status === JobStatus.APPROVED) {
                title = 'Tin tuyển dụng được duyệt';
                message = `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.`;
                type = 'success';
            } else if (status === JobStatus.REJECTED) {
                title = 'Tin tuyển dụng bị từ chối';
                message = `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
                type = 'error';
            }

            if (title) {
                await this.notificationsService.create(job.recruiter.userId, title, message, type, '/recruiter/jobs');
                this.messagesGateway.server
                    .to(`user_${job.recruiter.userId}`)
                    .emit('notification', { title, message, type, link: '/recruiter/jobs' });
            }
        }
      }

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

    this.messagesGateway.server.emit('adminJobUpdated');

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

  private async triggerJobNotifications(job: any) {
    try {
      const alerts = await this.jobAlertsService.findAllAlerts();
      const matchedAlerts = alerts.filter(alert =>
        job.title.toLowerCase().includes(alert.keywords.toLowerCase())
      );

      for (const alert of matchedAlerts) {
        await this.notificationsService.create(
          alert.userId,
          'Việc làm mới theo từ khóa của bạn',
          `Có 1 việc làm mới theo từ khóa tìm kiếm "${alert.keywords}". Vào xem ngay`,
          'info'
        );
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
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
      createdAt: job.createdAt,
      status: job.status,
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
