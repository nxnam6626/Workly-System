import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '@/modules/identity/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/identity/auth/guards/roles.guard';
import {
  Role,
  Roles,
} from '@/modules/identity/auth/decorators/roles.decorator';
import { PlanType, JobTier } from '@prisma/client';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    userId: string;
    roles: string[];
  };
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @Roles(Role.RECRUITER)
  async getCurrent(@Req() req: AuthRequest) {
    return this.subscriptionsService.getCurrentSubscription(req.user.userId);
  }

  @Post('purchase-plan')
  @Roles(Role.RECRUITER)
  async purchasePlan(
    @Req() req: AuthRequest,
    @Body() body: { planType: PlanType },
  ) {
    return this.subscriptionsService.purchasePlan(
      req.user.userId,
      body.planType,
    );
  }

  @Post('purchase-cv-quota')
  @Roles(Role.RECRUITER)
  async purchaseCvQuota(
    @Req() req: AuthRequest,
    @Body() body: { packageType: string },
  ) {
    return this.subscriptionsService.purchaseCvQuota(
      req.user.userId,
      body.packageType,
    );
  }

  @Post('purchase-job-slots')
  @Roles(Role.RECRUITER)
  async purchaseJobSlots(
    @Req() req: AuthRequest,
    @Body() body: { tier: JobTier; isBundle: boolean },
  ) {
    return this.subscriptionsService.purchaseJobSlots(
      req.user.userId,
      body.tier,
      body.isBundle,
    );
  }

  @Post('cancel')
  @Roles(Role.RECRUITER)
  async cancel(@Req() req: AuthRequest) {
    return this.subscriptionsService.cancel(req.user.userId);
  }
}
