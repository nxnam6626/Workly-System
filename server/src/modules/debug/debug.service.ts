import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanType } from '@/generated/prisma';

@Injectable()
export class DebugService {
  constructor(private readonly prisma: PrismaService) {}

  async forceSetSubscription(email: string, plan: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('Tính năng này chỉ dành cho môi trường Development.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { recruiter: true },
    });

    if (!user || !user.recruiter) {
      throw new NotFoundException(`Không tìm thấy nhà tuyển dụng với email: ${email}`);
    }

    const recruiterId = user.recruiter.recruiterId;

    if (plan === 'FREE') {
      await this.prisma.recruiterSubscription.deleteMany({
        where: { recruiterId },
      });
      return { message: `Đã reset tài khoản ${email} về gói FREE.` };
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30);

    const config = {
      LITE: {
        maxBasicPosts: 5,
        maxVipPosts: 2,
        maxUrgentPosts: 0,
        canViewAIReport: false,
      },
      GROWTH: {
        maxBasicPosts: 20,
        maxVipPosts: 10,
        maxUrgentPosts: 3,
        canViewAIReport: true,
      },
    };

    const planConfig = config[plan as keyof typeof config];
    if (!planConfig) throw new BadRequestException('Gói không hợp lệ (LITE/GROWTH/FREE).');

    const subscription = await this.prisma.recruiterSubscription.upsert({
      where: { recruiterId },
      update: {
        planType: plan as PlanType,
        ...planConfig,
        usedBasicPosts: 0,
        usedVipPosts: 0,
        usedUrgentPosts: 0,
        expiryDate,
        isCancelled: false,
      },
      create: {
        recruiterId,
        planType: plan as PlanType,
        ...planConfig,
        expiryDate,
      },
    });

    return {
      message: `Đã kích hoạt gói ${plan} cho ${email}.`,
      subscription,
    };
  }
}
