import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('candidate/:candidateId')
  async reportCandidate(
    @Request() req,
    @Body() dto: any,
    @Param('candidateId') candidateId: string,
  ) {
    const recruiterId = req.user.recruiterId;
    if (!recruiterId)
      throw new ForbiddenException(
        'Chỉ nhà tuyển dụng mới có thể báo cáo ứng viên.',
      );
    return this.reportsService.reportCandidate(recruiterId, candidateId, dto);
  }

  // Admin endpoint to see all reports
  @Get()
  async findAll() {
    return this.reportsService.findAll();
  }
}
