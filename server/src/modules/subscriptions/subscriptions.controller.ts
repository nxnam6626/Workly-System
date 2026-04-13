import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { PlanType } from '@prisma/client';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @Roles(Role.RECRUITER)
  async getCurrentSubscription(@Req() req) {
    return this.subscriptionsService.getCurrentSubscription(req.user.userId);
  }

  @Post('buy')
  @Roles(Role.RECRUITER)
  async buyPackage(@Req() req, @Body() body: { planType: PlanType }) {
    return this.subscriptionsService.buyPackage(req.user.userId, body.planType);
  }

  @Post('buy-cv-hunter')
  @Roles(Role.RECRUITER)
  async buyCvPackage(@Req() req, @Body() body: { packageType: string }) {
    return this.subscriptionsService.buyCvPackage(req.user.userId, body.packageType);
  }
}
