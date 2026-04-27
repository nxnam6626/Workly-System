import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { UnlockService } from './unlock.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role, Roles } from '../auth/decorators/roles.decorator';

@Controller('recruiters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecruitersController {
  constructor(
    private readonly recruitersService: RecruitersService,
    private readonly unlockService: UnlockService,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'ok', module: 'recruiters' };
  }

  @Get('dashboard')
  @Roles(Role.RECRUITER)
  getDashboardData(@Req() req: any, @Query('date') date?: string) {
    return this.recruitersService.getDashboardData(req.user.userId, date);
  }

  @Get('top-matches')
  @Roles(Role.RECRUITER)
  getTopMatches(@Req() req: any) {
    return this.recruitersService.getTopMatchesForAllJobs(req.user.userId);
  }

  @Get('wallet')
  @Roles(Role.RECRUITER)
  getWallet(@Req() req: any) {
    return this.unlockService.getWallet(req.user.userId);
  }

  @Get('match-summary')
  @Roles(Role.RECRUITER)
  getMatchSummary(@Req() req: any) {
    return this.recruitersService.getMatchSummary(req.user.userId);
  }

  @Get('matched/:jobId')
  @Roles(Role.RECRUITER)
  getMatchedCandidates(@Req() req: any, @Param('jobId') jobId: string) {
    return this.recruitersService.getMatchedCandidates(req.user.userId, jobId);
  }

  @Post('unlock')
  @Roles(Role.RECRUITER)
  unlockCandidate(
    @Req() req: any,
    @Body('candidateId') candidateId: string,
    @Body('jobPostingId') jobPostingId: string,
    @Body('cvId') cvId: string,
  ) {
    return this.unlockService.unlockCandidate(
      req.user.userId,
      candidateId,
      jobPostingId,
      cvId,
    );
  }
}
