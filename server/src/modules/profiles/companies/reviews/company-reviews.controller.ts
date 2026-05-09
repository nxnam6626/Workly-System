import { Controller, Post, Get, Body, Param, UseGuards, Request, Query, Patch, Delete } from '@nestjs/common';
import { CompanyReviewsService } from './company-reviews.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';

@Controller('company-reviews')
export class CompanyReviewsController {
  constructor(private readonly reviewsService: CompanyReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':companyId/:applicationId')
  async create(
    @Request() req,
    @Param('companyId') companyId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: any,
  ) {
    const userId = req.user.userId;
    return this.reviewsService.create(userId, companyId, applicationId, dto);
  }

  @Get(':companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return this.reviewsService.findByCompany(companyId);
  }

  @Get(':companyId/stats')
  async getStats(@Param('companyId') companyId: string) {
    return this.reviewsService.getCompanyStats(companyId);
  }

  // --- Admin Endpoints ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('admin/all')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.reviewsService.findAllAdmin(pageNum, limitNum, status, searchTerm);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('admin/:id/status')
  async updateStatusAdmin(
    @Param('id') reviewId: string,
    @Body('status') status: string,
  ) {
    return this.reviewsService.updateStatusAdmin(reviewId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('admin/:id')
  async deleteAdmin(@Param('id') reviewId: string) {
    return this.reviewsService.deleteAdmin(reviewId);
  }
}
