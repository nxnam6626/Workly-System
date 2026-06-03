import { Controller, Get, UseGuards, Query, Param } from '@nestjs/common';
import { BackofficeService } from '@/modules/backoffice/backoffice.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin') // Keeping 'admin' path to avoid breaking frontend, but in Backoffice domain
export class BackofficeController {
  constructor(private readonly backofficeService: BackofficeService) {}

  @Get('dashboard/stats')
  getDashboardStats() {
    return this.backofficeService.getDashboardStats();
  }

  @Get('revenue/stats')
  getRevenueStats() {
    return this.backofficeService.getRevenueStats();
  }

  @Get('revenue/transactions')
  getRecentTransactions(
    @Query('limit') limit?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.backofficeService.getRecentTransactions(
      limit ? Number(limit) : 20,
      companyId,
    );
  }

  @Get('recruiters/violations')
  getViolatingRecruiters() {
    return this.backofficeService.getViolatingRecruiters();
  }

  @Get('candidates/violations')
  getViolatingCandidates() {
    return this.backofficeService.getViolatingCandidates();
  }

  @Get('violations/latest')
  getLatestViolations() {
    return this.backofficeService.getLatestViolations();
  }

  @Get('users/:userId/violations/logs')
  getUserViolationLogs(@Param('userId') userId: string) {
    return this.backofficeService.getUserViolationLogs(userId);
  }

  @Get('companies')
  findAllCompanies(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    return this.backofficeService.findAllCompanies({
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
      search,
    });
  }

  @Get('companies/:id')
  findCompanyById(@Param('id') id: string) {
    return this.backofficeService.findCompanyById(id);
  }
}
