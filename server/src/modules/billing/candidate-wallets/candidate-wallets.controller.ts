import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { CandidateWalletsService } from './candidate-wallets.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role, Roles } from '@/common/decorators/roles.decorator';
import { Request } from 'express';
import { PrismaService } from '@/prisma/prisma.service';
import { Public } from '@/common/decorators/public.decorator';

interface AuthRequest extends Request {
  user: {
    userId: string;
    roles: string[];
  };
}

@Controller('candidate-wallets')
export class CandidateWalletsController {
  constructor(
    private readonly walletsService: CandidateWalletsService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('balance')
  @Roles(Role.CANDIDATE)
  async getBalance(@Req() req: AuthRequest) {
    return this.walletsService.getBalance(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('transactions')
  @Roles(Role.CANDIDATE)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('top-up')
  @Roles(Role.CANDIDATE)
  async topUp(@Req() req: AuthRequest, @Body() body: { amount: number }) {
    return this.walletsService.topUp(req.user.userId, body.amount);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('activate-job-search')
  @Roles(Role.CANDIDATE)
  async activateJobSearch(@Req() req: AuthRequest) {
    // Retrieve candidateId first via relation
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId: req.user.userId },
    });

    if (!candidate)
      throw new NotFoundException('Tài khoản ứng viên không tồn tại');

    return this.walletsService.activateJobSearch(candidate.candidateId);
  }

  @Public()
  @Post('payos-webhook')
  async handleWebhook(@Body() body: any) {
    // NOTE: PayOS webhook configuration usually sends ONLY TO ONE Global Webhook URL on free tier.
    // If multiple services handle it, this may need to flow through a dispatcher,
    // but by default implementing specific service handler for flexibility.
    return this.walletsService.handleWebhook(body);
  }
}
