import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('revenue/stats')
  getRevenueStats() {
    return this.adminService.getRevenueStats();
  }

  @Get('recruiters/violations')
  getViolatingRecruiters() {
    return this.adminService.getViolatingRecruiters();
  }

  @Get('violations/latest')
  getLatestViolations() {
    return this.adminService.getLatestViolations();
  }
}
