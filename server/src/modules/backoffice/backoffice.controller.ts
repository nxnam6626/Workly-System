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
  getRecentTransactions() {
    return this.backofficeService.getRecentTransactions();
  }

  @Get('recruiters/violations')
  getViolatingRecruiters() {
    return this.backofficeService.getViolatingRecruiters();
  }

  @Get('violations/latest')
  getLatestViolations() {
    return this.backofficeService.getLatestViolations();
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
