import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { MessagesService } from '../messages/messages.service';

@Injectable()
export class RecruitersService {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) { }

  async getDashboardData(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy dữ liệu nhà tuyển dụng.');
    }

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
    const { unreadCount: newMessagesCount } = await this.messagesService.getUnreadCount(userId);

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
    };
  }
}
