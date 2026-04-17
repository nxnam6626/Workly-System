import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JobStatus, StatusUser, TransactionType } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, totalJobs, pendingJobs, totalApproved, totalRejected] =
      await Promise.all([
        this.prisma.user.count({ where: { status: StatusUser.ACTIVE } }),
        this.prisma.jobPosting.count({ where: { status: JobStatus.APPROVED } }),
        this.prisma.jobPosting.count({ where: { status: JobStatus.PENDING } }),
        this.prisma.jobPosting.count({ where: { status: JobStatus.APPROVED } }),
        this.prisma.jobPosting.count({ where: { status: JobStatus.REJECTED } }),
      ]);

    return {
      totalUsers,
      totalJobs,
      pendingJobs,
      totalApproved,
      totalRejected,
      crawlCount: 0,
      approvalRate:
        totalApproved + totalRejected > 0
          ? Math.round((totalApproved / (totalApproved + totalRejected)) * 100)
          : 100,
    };
  }

  async getRevenueStats() {
    // Tổng doanh thu thực từ giao dịch nạp tiền thành công (realMoney)
    const depositAgg = await this.prisma.transaction.aggregate({
      where: { type: TransactionType.DEPOSIT, status: 'SUCCESS' },
      _sum: { realMoney: true, amount: true },
      _count: true,
    });

    // Doanh thu từ mua gói đăng tin
    const packageAgg = await this.prisma.transaction.aggregate({
      where: { type: TransactionType.BUY_PACKAGE, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    });

    // Doanh thu từ đăng tin
    const postJobAgg = await this.prisma.transaction.aggregate({
      where: { type: TransactionType.POST_JOB, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    });

    // Doanh thu từ mở CV
    const openCvAgg = await this.prisma.transaction.aggregate({
      where: { type: TransactionType.OPEN_CV, status: 'SUCCESS' },
      _sum: { amount: true },
      _count: true,
    });

    // Doanh thu thực từ chi tiêu (Spending Revenue) - 30 ngày gần nhất
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentSpending = await this.prisma.transaction.findMany({
      where: {
        type: {
          in: [
            TransactionType.BUY_PACKAGE,
            TransactionType.POST_JOB,
            TransactionType.OPEN_CV,
          ],
        },
        status: 'SUCCESS',
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date (Spending)
    const dailyRevenue: Record<string, number> = {};
    for (const tx of recentSpending) {
      const date = tx.createdAt.toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + (tx.amount || 0);
    }

    // Top 5 spenders by total transactions
    const topSpendersAgg = await this.prisma.transaction.groupBy({
      by: ['walletId'],
      where: {
        type: {
          in: [
            TransactionType.BUY_PACKAGE,
            TransactionType.POST_JOB,
            TransactionType.OPEN_CV,
          ],
        },
        status: 'SUCCESS',
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const topSpendersData = await Promise.all(
      topSpendersAgg.map(async (agg) => {
        const wallet = await this.prisma.recruiterWallet.findUnique({
          where: { walletId: agg.walletId },
          include: {
            recruiter: {
              include: {
                user: { select: { email: true } },
                company: { select: { companyName: true } },
              },
            },
          },
        });
        return {
          companyName:
            wallet?.recruiter?.company?.companyName ||
            wallet?.recruiter?.user?.email ||
            'N/A',
          balance: wallet?.balance || 0,
          spentAmount: agg._sum.amount || 0,
          recruiterId: wallet?.recruiterId || '',
        };
      }),
    );

    const totalSpending =
      (packageAgg._sum.amount || 0) +
      (postJobAgg._sum.amount || 0) +
      (openCvAgg._sum.amount || 0);

    return {
      totalDepositVnd: depositAgg._sum.realMoney || 0,
      totalDepositXu: depositAgg._sum.amount || 0,
      depositCount: depositAgg._count,
      totalSpendingRevenue: totalSpending,
      packageSpend: packageAgg._sum.amount || 0,
      packageCount: packageAgg._count,
      postJobSpend: postJobAgg._sum.amount || 0,
      postJobCount: postJobAgg._count,
      openCvSpend: openCvAgg._sum.amount || 0,
      openCvCount: openCvAgg._count,
      dailyRevenue,
      topSpenders: topSpendersData,
    };
  }

  async getLatestViolations(limit = 5) {
    const recruiters = await this.prisma.recruiter.findMany({
      where: { user: { violations: { gt: 0 } } },
      orderBy: { user: { violations: 'desc' } },
      take: limit,
      include: {
        user: {
          select: { email: true, status: true, avatar: true, updatedAt: true, violations: true },
        },
        company: { select: { companyName: true } },
      },
    });

    return recruiters.map((r) => ({
      recruiterId: r.recruiterId,
      companyName: r.company?.companyName || 'Chưa có công ty',
      email: r.user.email,
      avatar: r.user.avatar,
      violationCount: r.user.violations,
      status: r.user.status,
      updatedAt: r.user.updatedAt,
    }));
  }

  async getViolatingRecruiters() {
    const recruiters = await this.prisma.recruiter.findMany({
      where: { user: { violations: { gt: 0 } } },
      orderBy: { user: { violations: 'desc' } },
      include: {
        user: { select: { email: true, status: true, violations: true } },
        company: { select: { companyName: true } },
      },
    });

    return recruiters.map((r) => ({
      recruiterId: r.recruiterId,
      companyName: r.company?.companyName || 'Chưa có công ty',
      email: r.user.email,
      violationCount: r.user.violations,
      status: r.user.status,
    }));
  }
}
