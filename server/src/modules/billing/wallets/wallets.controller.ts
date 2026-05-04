import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Query,
} from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role, Roles } from '@/common/decorators/roles.decorator';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    userId: string;
    roles: string[];
  };
}

@Controller('wallets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('balance')
  @Roles(Role.RECRUITER)
  async getBalance(@Req() req: AuthRequest) {
    return this.walletsService.getBalance(req.user.userId);
  }

  @Get('transactions')
  @Roles(Role.RECRUITER)
  async getTransactions(
    @Req() req: AuthRequest,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.walletsService.getTransactions(
      req.user.userId,
      skip ? Number(skip) : undefined,
      take ? Number(take) : undefined,
    );
  }

  @Post('top-up')
  @Roles(Role.RECRUITER)
  async topUp(@Req() req: AuthRequest, @Body() body: { amount: number }) {
    return this.walletsService.topUp(req.user.userId, body.amount);
  }

  @Post('transactions/:id/resume')
  @Roles(Role.RECRUITER)
  async resumePayment(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.walletsService.resumePayment(req.user.userId, id);
  }

  @Post('payos-webhook')
  async handleWebhook(@Body() body: any) {
    return this.walletsService.handleWebhook(body);
  }
}
