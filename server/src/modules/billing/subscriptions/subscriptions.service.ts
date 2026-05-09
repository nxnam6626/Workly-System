import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { WalletsService } from '@/modules/billing/wallets/wallets.service';
import {
  PlanType,
  JobTier,
  TransactionType,
  RecruiterSubscription,
} from '@prisma/client';
import {
  PLAN_CONFIGS,
  CV_PACKAGES,
  SLOT_PRICING,
  PlanConfig,
} from './subscriptions.constants';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) {}

  async purchasePlan(userId: string, planType: PlanType) {
    const recruiter = await this.getRecruiterOrThrow(userId);
    const config = this.getPlanConfig(planType);

    const refundInfo = await this.calculateUpgradeRefund(recruiter.recruiterId);
    await this.executePayment(
      recruiter.recruiterId,
      planType,
      config.cost,
      refundInfo,
    );

    if (config.cvQuota > 0) {
      await this.walletsService.addCvQuota(
        recruiter.recruiterId,
        config.cvQuota,
        `Gifted ${config.cvQuota} CV unlocks for ${planType} plan subscription`,
      );
    }

    const subscription = await this.upsertSubscription(
      recruiter.recruiterId,
      planType,
      config,
    );
    return {
      message: `Successfully subscribed to ${planType} plan.`,
      subscription,
    };
  }

  async checkPermissionAndDeduct(userId: string, jobTier: JobTier) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter) throw new NotFoundException('Recruiter not found.');

    const sub = recruiter.recruiterSubscription;
    const isActive = sub ? new Date() <= sub.expiryDate : false;

    if (jobTier === JobTier.BASIC) {
      return this.handleBasicPost(recruiter.recruiterId, sub!, isActive);
    }

    if (!isActive) {
      throw new ForbiddenException(
        'PROFESSIONAL/URGENT tiers are only available for members with an active subscription.',
      );
    }

    return this.handlePremiumPost(sub!, jobTier);
  }

  async getCurrentSubscription(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found.');

    // Nếu recruiter là MEMBER và thuộc một công ty, lấy subscription của MASTER công ty đó
    if (recruiter.companyRole === 'MEMBER' && recruiter.companyId) {
      const masterRecruiter = await this.prisma.recruiter.findFirst({
        where: {
          companyId: recruiter.companyId,
          companyRole: 'MASTER',
        },
        include: { recruiterSubscription: true },
      });
      if (masterRecruiter && masterRecruiter.recruiterSubscription) {
        return masterRecruiter.recruiterSubscription;
      }
    }

    return recruiter.recruiterSubscription;
  }

  async purchaseCvQuota(userId: string, packageType: string) {
    const recruiter = await this.getRecruiterOrThrow(userId);
    const pkg = CV_PACKAGES[packageType];
    if (!pkg) throw new BadRequestException('Invalid CV package type.');

    try {
      await this.walletsService.deduct(
        recruiter.recruiterId,
        pkg.cost,
        `Purchase CV Hunter Package: ${pkg.label}`,
        TransactionType.BUY_PACKAGE,
      );

      await this.walletsService.addCvQuota(
        recruiter.recruiterId,
        pkg.quota,
        `Added ${pkg.quota} CV unlocks from ${packageType} package`,
      );

      return {
        success: true,
        message: `Successfully purchased ${packageType} package`,
        quotaReceived: pkg.quota,
      };
    } catch (e) {
      if (e instanceof BadRequestException)
        throw new BadRequestException(
          `Insufficient Credits. ${pkg.cost} Xu required.`,
        );
      throw e;
    }
  }

  async purchaseJobSlots(userId: string, tier: JobTier, isBundle: boolean) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter?.recruiterSubscription) {
      throw new BadRequestException(
        'You need an active subscription before purchasing extra slots.',
      );
    }

    if (new Date() > recruiter.recruiterSubscription.expiryDate) {
      throw new BadRequestException(
        'Your subscription has expired. Please renew first.',
      );
    }

    const pricing = SLOT_PRICING[tier];
    if (!pricing)
      throw new BadRequestException(
        'Extra slots are only available for PROFESSIONAL or URGENT tiers.',
      );

    const cost = isBundle ? pricing.bundle : pricing.single;
    const slots = isBundle ? pricing.slots.bundle : pricing.slots.single;

    try {
      await this.walletsService.deduct(
        recruiter.recruiterId,
        cost,
        `Purchase ${slots} additional ${tier} job slots (${isBundle ? 'Bundle' : 'Single'})`,
        TransactionType.BUY_PACKAGE,
      );

      const updateField =
        tier === JobTier.PROFESSIONAL ? 'maxVipPosts' : 'maxUrgentPosts';
      const updatedSubscription =
        await this.prisma.recruiterSubscription.update({
          where: { recruiterId: recruiter.recruiterId },
          data: { [updateField]: { increment: slots } },
        });

      return {
        success: true,
        message: `Successfully purchased ${slots} ${tier} job slots.`,
        newMaxSlots: updatedSubscription[updateField],
      };
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException(
        `Insufficient Credits. ${cost} Xu required.`,
      );
    }
  }

  async cancel(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter?.recruiterSubscription)
      throw new NotFoundException('No active subscription found.');
    if (recruiter.recruiterSubscription.isCancelled)
      throw new BadRequestException(
        'Subscription is already marked for cancellation.',
      );

    return this.prisma.recruiterSubscription.update({
      where: { recruiterId: recruiter.recruiterId },
      data: { isCancelled: true },
    });
  }

  private async getRecruiterOrThrow(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found.');
    return recruiter;
  }

  private getPlanConfig(planType: PlanType): PlanConfig {
    const config = PLAN_CONFIGS[planType];
    if (!config) throw new BadRequestException('Invalid plan type.');
    return config;
  }

  private async calculateUpgradeRefund(recruiterId: string) {
    const oldSub = await this.prisma.recruiterSubscription.findUnique({
      where: { recruiterId },
    });
    if (!oldSub || new Date(oldSub.expiryDate) <= new Date())
      return { amount: 0, planName: '' };

    const oldCost = oldSub.planType === PlanType.GROWTH ? 2000 : 500;
    const calcPoints = (sub: RecruiterSubscription) =>
      sub.maxBasicPosts * 1 + sub.maxVipPosts * 2 + sub.maxUrgentPosts * 4;
    const calcUsed = (sub: RecruiterSubscription) =>
      sub.usedBasicPosts * 1 + sub.usedVipPosts * 2 + sub.usedUrgentPosts * 4;

    const totalMax = calcPoints(oldSub);
    if (totalMax === 0) return { amount: 0, planName: oldSub.planType };

    const unusedRatio = Math.max(0, (totalMax - calcUsed(oldSub)) / totalMax);
    return {
      amount: Math.floor(oldCost * unusedRatio),
      planName: oldSub.planType,
    };
  }

  private async executePayment(
    recruiterId: string,
    planType: PlanType,
    cost: number,
    refund: { amount: number; planName: string },
  ) {
    try {
      await this.walletsService.deduct(
        recruiterId,
        cost,
        `Purchase service plan: ${planType}`,
        TransactionType.BUY_PACKAGE,
      );
      if (refund.amount > 0) {
        await this.walletsService.add(
          recruiterId,
          refund.amount,
          `Refund remaining Credits from old ${refund.planName} Plan`,
          TransactionType.DEPOSIT,
        );
      }
    } catch {
      throw new BadRequestException('Insufficient Credits. Please top up.');
    }
  }

  private async upsertSubscription(
    recruiterId: string,
    planType: PlanType,
    config: PlanConfig,
  ) {
    const data = {
      planType,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usedBasicPosts: 0,
      usedVipPosts: 0,
      usedUrgentPosts: 0,
      isCancelled: false,
      maxBasicPosts: config.maxBasicPosts,
      maxVipPosts: config.maxVipPosts,
      maxUrgentPosts: config.maxUrgentPosts,
      canViewAIReport: config.canViewAIReport,
    };

    return this.prisma.recruiterSubscription.upsert({
      where: { recruiterId },
      update: data,
      create: { recruiterId, ...data },
    });
  }

  private async handleBasicPost(
    recruiterId: string,
    sub: RecruiterSubscription,
    isActive: boolean,
  ) {
    if (isActive && sub.usedBasicPosts < sub.maxBasicPosts) {
      await this.prisma.recruiterSubscription.update({
        where: { subscriptionId: sub.subscriptionId },
        data: { usedBasicPosts: { increment: 1 } },
      });
      return { method: 'SUBSCRIPTION_QUOTA', cost: 0 };
    }

    try {
      await this.walletsService.deduct(
        recruiterId,
        100,
        'Single payment for BASIC job posting',
        TransactionType.POST_JOB,
      );
      return { method: 'WALLET_CREDIT', cost: 100 };
    } catch {
      throw new BadRequestException(
        'Insufficient balance (100 Credits required for BASIC post).',
      );
    }
  }

  private async handlePremiumPost(
    sub: RecruiterSubscription,
    jobTier: JobTier,
  ) {
    const isProfessional = jobTier === JobTier.PROFESSIONAL;
    const usedField = isProfessional ? 'usedVipPosts' : 'usedUrgentPosts';
    const maxField = isProfessional ? 'maxVipPosts' : 'maxUrgentPosts';

    if (sub[usedField] >= sub[maxField]) {
      throw new ForbiddenException(
        `You have used up your ${jobTier} post quota in the current plan. Please purchase more slots.`,
      );
    }

    await this.prisma.recruiterSubscription.update({
      where: { subscriptionId: sub.subscriptionId },
      data: { [usedField]: { increment: 1 } },
    });

    return { method: 'SUBSCRIPTION_QUOTA', cost: 0 };
  }
}
