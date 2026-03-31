import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, StatusUser } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalUsers,
      totalJobs,
      pendingJobs,
      totalCrawllogs,
    ] = await Promise.all([
      // Total active users
      this.prisma.user.count({ where: { status: StatusUser.ACTIVE } }),
      // Total approved jobs
      this.prisma.jobPosting.count({ where: { status: JobStatus.APPROVED } }),
      // Jobs pending approval
      this.prisma.jobPosting.count({ where: { status: JobStatus.PENDING } }),
      // Total crawler executions
      this.prisma.crawlLog.count(),
    ]);

    // Format metrics
    return {
       totalUsers,
       totalJobs,
       pendingJobs,
       crawlCount: totalCrawllogs,
       approvalRate: totalJobs > 0 ? Math.round((totalJobs / (totalJobs + pendingJobs)) * 100) : 100
    };
  }
}
