import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { PlanType, JobTier, TransactionType } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) {}

  async buyPackage(userId: string, planType: PlanType) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');
    }

    let cost = 0;
    const updateData: any = {
      planType,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 ngày
      usedBasicPosts: 0,
      usedVipPosts: 0,
      usedUrgentPosts: 0,
    };

    if (planType === PlanType.LITE) {
      cost = 500;
      updateData.maxBasicPosts = 5;
      updateData.maxVipPosts = 2;
      updateData.maxUrgentPosts = 0;
      updateData.canViewAIReport = true;
    } else if (planType === PlanType.GROWTH) {
      cost = 2000;
      updateData.maxBasicPosts = 20;
      updateData.maxVipPosts = 10;
      updateData.maxUrgentPosts = 3;
      updateData.canViewAIReport = true;
    } else {
      throw new BadRequestException('Gói cước không hợp lệ.');
    }

    // Tính toán số dư hoàn lại của gói CŨ (nếu còn hạn và còn dư tin)
    let refundAmount = 0;
    let oldPlanName = '';
    const oldSub = await this.prisma.recruiterSubscription.findUnique({
      where: { recruiterId: recruiter.recruiterId },
    });

    if (oldSub && new Date(oldSub.expiryDate) > new Date()) {
      const oldCost = oldSub.planType === PlanType.GROWTH ? 2000 : 500;
      
      // Trọng số giá trị: Basic (1), VIP (2), Urgent (4)
      const totalMaxPoints = 
        (oldSub.maxBasicPosts * 1) + 
        (oldSub.maxVipPosts * 2) + 
        (oldSub.maxUrgentPosts * 4);

      const totalUsedPoints = 
        (oldSub.usedBasicPosts * 1) + 
        (oldSub.usedVipPosts * 2) + 
        (oldSub.usedUrgentPosts * 4);

      if (totalMaxPoints > 0) {
        const unusedRatio = Math.max(0, (totalMaxPoints - totalUsedPoints) / totalMaxPoints);
        // Hoàn lại tỉ lệ % giá trị của gói cũ
        refundAmount = Math.floor(oldCost * unusedRatio);
      }
      
      oldPlanName = oldSub.planType;
    }

    // Trừ Credits (Ví) cho gói MỚI
    try {
      await this.walletsService.deduct(
        recruiter.recruiterId,
        cost,
        `Mua gói dịch vụ ${planType}`,
        TransactionType.BUY_PACKAGE,
      );

      // Cộng lại phần Credits dư từ gói cũ (nếu có)
      if (refundAmount > 0) {
        await this.walletsService.add(
          recruiter.recruiterId,
          refundAmount,
          `Hoàn lại Credits dư từ Gói ${oldPlanName} cũ`,
          // @ts-ignore
          'DEPOSIT',
        );
      }
    } catch (e) {
      throw new BadRequestException(
        'Số dư Credits không đủ để mua gói này. Vui lòng nạp thêm.',
      );
    }

    // Cập nhật hoặc tạo Subscription
    const subscription = await this.prisma.recruiterSubscription.upsert({
      where: { recruiterId: recruiter.recruiterId },
      update: updateData,
      create: {
        recruiterId: recruiter.recruiterId,
        ...updateData,
      },
    });

    return {
      message: `Đăng ký thành công gói ${planType}.`,
      subscription,
    };
  }

  async checkPermissionAndDeduct(userId: string, jobTier: JobTier) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });
    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');
    }

    const sub = recruiter.recruiterSubscription;
    const isExpired = sub ? new Date() > sub.expiryDate : true;

    // Chi phí lẻ
    const costMap = {
      [JobTier.BASIC]: 100,
      [JobTier.PROFESSIONAL]: 250,
      [JobTier.URGENT]: 450,
    };
    const cost = costMap[jobTier];

    // Xác định xem có còn Quota trong gói không (nếu gói còn hạn)
    let canUseQuota = false;
    if (sub && !isExpired) {
      if (jobTier === JobTier.BASIC && sub.usedBasicPosts < sub.maxBasicPosts)
        canUseQuota = true;
      if (
        jobTier === JobTier.PROFESSIONAL &&
        sub.usedVipPosts < sub.maxVipPosts
      )
        canUseQuota = true;
      if (
        jobTier === JobTier.URGENT &&
        sub.usedUrgentPosts < sub.maxUrgentPosts
      )
        canUseQuota = true;
    }

    if (canUseQuota) {
      // Dùng quota
      await this.prisma.recruiterSubscription.update({
        where: { recruiterId: recruiter.recruiterId },
        data: {
          usedBasicPosts:
            jobTier === JobTier.BASIC ? { increment: 1 } : undefined,
          usedVipPosts:
            jobTier === JobTier.PROFESSIONAL ? { increment: 1 } : undefined,
          usedUrgentPosts:
            jobTier === JobTier.URGENT ? { increment: 1 } : undefined,
        },
      });
      return { usingQuota: true, cost: 0 };
    }

    // Nếu hết quota hoặc không có gói, trừ ví thủ công (Hệ thống Pay-As-You-Go linh hoạt theo thiết kế Hybrid)
    try {
      await this.walletsService.deduct(
        recruiter.recruiterId,
        cost,
        `Thanh toán lẻ cho tin tuyển dụng Hạng ${jobTier}`,
        TransactionType.POST_JOB,
      );
      return { usingQuota: false, cost };
    } catch (e) {
      throw new BadRequestException(
        `Cần ${cost} Credits để thanh toán tin loại này (Gói mua của bạn đã hết hạn mức cho loại tin này). Vui lòng nạp thêm xu!`,
      );
    }
  }

  async getCurrentSubscription(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });
    if (!recruiter) {
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');
    }
    return recruiter.recruiterSubscription;
  }

  async buyCvPackage(userId: string, packageType: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter)
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');

    let cost = 0;
    let quota = 0;
    let description = '';

    if (packageType === 'XEM_NHANH') {
      cost = 150;
      quota = 6;
      description = 'Mua Gói CV Hunter "Xem Nhanh" (6 Lượt)';
    } else if (packageType === 'SAN_TAI') {
      cost = 400;
      quota = 20;
      description = 'Mua Gói CV Hunter "Săn Tài" (20 Lượt)';
    } else {
      throw new BadRequestException('Gói CV không hợp lệ.');
    }

    try {
      // 1. Trừ tiền mua gói
      await this.walletsService.deduct(
        recruiter.recruiterId,
        cost,
        description,
        TransactionType.BUY_PACKAGE,
      );

      // 2. Chuyển Quota vào Wallet
      await this.walletsService.addCvQuota(
        recruiter.recruiterId,
        quota,
        `Cộng ${quota} lượt mở CV từ gói ${packageType}`,
      );

      return {
        success: true,
        message: `Thành công mua gói ${packageType}`,
        quotaReceived: quota,
      };
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw new BadRequestException(
          `Cần ${cost} Xu để mua gói này. Vui lòng nạp thêm!`,
        );
      }
      throw e;
    }
  }
}
