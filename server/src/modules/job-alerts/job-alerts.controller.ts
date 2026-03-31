import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JobAlertsService } from './job-alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Job Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-alerts')
export class JobAlertsController {
  constructor(private readonly jobAlertsService: JobAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách từ khóa đã lưu của người dùng' })
  async findAll(@CurrentUser('userId') userId: string) {
    return this.jobAlertsService.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Lưu một từ khóa tìm việc mới' })
  async create(@CurrentUser('userId') userId: string, @Body('keywords') keywords: string) {
    return this.jobAlertsService.create(userId, keywords);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa một từ khóa đã lưu' })
  async remove(@Param('id') jobAlertId: string, @CurrentUser('userId') userId: string) {
    return this.jobAlertsService.remove(jobAlertId, userId);
  }
}
