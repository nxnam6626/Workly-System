import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '@/modules/identity/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/identity/auth/guards/roles.guard';
import {
  Roles,
  Role,
} from '@/modules/identity/auth/decorators/roles.decorator';

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

  @Get('companies')
  findAllCompanies(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.findAllCompanies({
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
      search,
    });
  }

  @Get('companies/:id')
  findCompanyById(@Param('id') id: string) {
    return this.adminService.findCompanyById(id);
  }
}
