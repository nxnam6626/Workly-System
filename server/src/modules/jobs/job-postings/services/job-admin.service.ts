import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { JobStatus } from '@prisma/client';
import { AdminFilterJobPostingDto } from '../dto/admin-filter-job-posting.dto';
import { JobSearchService } from './job-search.service';
import { JobNotificationService } from './job-notification.service';
import { MessagesGateway } from '../../../messages/messages.gateway';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobAdminService {
  constructor(
    private prisma: PrismaService,
    private jobSearchService: JobSearchService,
    private jobNotificationService: JobNotificationService,
    private messagesGateway: MessagesGateway,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  async getAdminStats() {
    const [totalPending, totalApproved, totalRejected] = await Promise.all([
      this.prisma.jobPosting.count({ where: { status: 'PENDING' } }),
      this.prisma.jobPosting.count({ where: { status: 'APPROVED' } }),
      this.prisma.jobPosting.count({ where: { status: 'REJECTED' } }),
    ]);
    return { totalPending, totalApproved, totalRejected };
  }

  async findAllAdmin(query: AdminFilterJobPostingDto) {
    const { status, minAiScore, searchTerm, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (minAiScore !== undefined) where.aiReliabilityScore = { gte: minAiScore };
    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { company: { companyName: { contains: searchTerm, mode: 'insensitive' } } },
      ];
    }
    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where, skip, take: limit,
        include: { company: true, recruiter: { include: { user: { select: { email: true } } } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async updateStatus(id: string, status: JobStatus, adminId: string, reason?: string) {
    const job = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
        ...(status === JobStatus.REJECTED && reason && {
          moderationFeedback: { score: 0, safe: false, reason, feedback: ['Admin từ chối thủ công'] },
        }),
      },
      include: { recruiter: true, company: true },
    });

    if (job.recruiter?.userId) {
      const type = status === JobStatus.APPROVED ? 'success' : 'error';
      const title = status === JobStatus.APPROVED ? 'Tin tuyển dụng được duyệt' : 'Tin tuyển dụng bị từ chối';
      const message = status === JobStatus.APPROVED 
        ? `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.` 
        : `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
      
      await this.jobNotificationService.sendStatusNotification(job.recruiter.userId, title, message, type, '/recruiter/jobs');
    }

    if (status === JobStatus.APPROVED) {
      this.jobSearchService.syncJobToES(job);
      await this.matchingQueue.add('match', { jobId: id });
    }

    this.messagesGateway.server.emit('adminJobUpdated');
    return job;
  }

  async updateStatusBulk(ids: string[], status: JobStatus, adminId: string) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp danh sách ID để thao tác hàng loạt.');
    }

    const jobsToUpdate = await this.prisma.jobPosting.findMany({
      where: { jobPostingId: { in: ids } },
      include: { recruiter: true },
    });

    const result = await this.prisma.jobPosting.updateMany({
      where: { jobPostingId: { in: ids } },
      data: { status, approvedBy: adminId, updatedAt: new Date() },
    });

    for (const job of jobsToUpdate) {
      if (job.recruiter?.userId) {
        const type = status === JobStatus.APPROVED ? 'success' : 'error';
        const title = status === JobStatus.APPROVED ? 'Tin tuyển dụng được duyệt' : 'Tin tuyển dụng bị từ chối';
        const message = status === JobStatus.APPROVED 
          ? `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.` 
          : `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
        
        await this.jobNotificationService.sendStatusNotification(job.recruiter.userId, title, message, type, '/recruiter/jobs');
      }
      if (status === JobStatus.APPROVED) {
        this.jobSearchService.syncJobToES(job);
      }
    }

    this.messagesGateway.server.emit('adminJobUpdated');
    return { count: result.count };
  }

  async removeBulk(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException('Vui lòng cung cấp danh sách ID để xóa hàng loạt.');
    }
    const result = await this.prisma.jobPosting.deleteMany({
      where: { jobPostingId: { in: ids } },
    });
    this.messagesGateway.server.emit('adminJobUpdated');
    return { count: result.count };
  }
}
