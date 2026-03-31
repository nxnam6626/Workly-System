import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/roles.decorator';

@Controller('recruiters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RecruitersController {
  constructor(private readonly recruitersService: RecruitersService) { }

  @Get('dashboard')
  @Roles(Role.RECRUITER)
  getDashboardData(@Req() req: any) {
    return this.recruitersService.getDashboardData(req.user.userId);
  }
}
