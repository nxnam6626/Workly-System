import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { MessagesGateway } from '../../messages/messages.gateway';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class JobPostingsService {
  constructor(
     private prisma: PrismaService,
     private messagesGateway: MessagesGateway,
     private notificationsService: NotificationsService
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




  async findAll(query: FilterJobPostingDto) {
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

    return this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...rest,
        ...(deadline && { deadline: new Date(deadline) }),
        updatedAt: new Date(),
      },
    });
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
        approvedBy: adminId, // Reuse approvedBy field to track who approved/rejected
        updatedAt: new Date(),
      },
      include: { recruiter: true }
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

    this.messagesGateway.server.emit('adminJobUpdated');

    return { message: `Đã cập nhật trạng thái thành công cho ${result.count} tin tuyển dụng.`, count: result.count };
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.jobPosting.delete({
      where: { jobPostingId: id },
    });
  }
}
