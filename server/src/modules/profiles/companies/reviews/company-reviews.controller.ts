import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CompanyReviewsService } from './company-reviews.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

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
    const candidateId = req.user.candidateId;
    return this.reviewsService.create(candidateId, companyId, applicationId, dto);
  }

  @Get(':companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return this.reviewsService.findByCompany(companyId);
  }

  @Get(':companyId/stats')
  async getStats(@Param('companyId') companyId: string) {
    return this.reviewsService.getCompanyStats(companyId);
  }
}
