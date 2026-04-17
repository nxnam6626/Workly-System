import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';

@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async getBalance(@Req() req) {
    return this.walletsService.getBalance(req.user.userId);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async getTransactions(@Req() req) {
    return this.walletsService.getTransactions(req.user.userId);
  }

  @Post('top-up')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async topUp(@Req() req, @Body() body: { amount: number }) {
    return this.walletsService.createPaymentLink(req.user.userId, body.amount);
  }

  @Post('transactions/:id/resume')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  async resumeTopUp(@Req() req, @Param('id') id: string) {
    return this.walletsService.resumePaymentLink(req.user.userId, id);
  }

  @Post('payos-webhook')
  async payosWebhook(@Body() body: any) {
    return this.walletsService.verifyWebhook(body);
  }
}
