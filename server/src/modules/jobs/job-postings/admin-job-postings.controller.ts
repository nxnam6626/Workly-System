import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { JobStatus } from '@prisma/client';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Job Postings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/job-postings')
export class AdminJobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tin tuyển dụng với bộ lọc dành cho Admin' })
  findAll(@Query() query: AdminFilterJobPostingDto) {
    return this.jobPostingsService.findAllAdmin(query);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Duyệt một tin tuyển dụng' })
  approve(@Param('id') id: string, @CurrentUser('userId') adminId: string) {
    return this.jobPostingsService.updateStatus(id, JobStatus.APPROVED, adminId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Từ chối một tin tuyển dụng' })
  reject(@Param('id') id: string, @CurrentUser('userId') adminId: string) {
    return this.jobPostingsService.updateStatus(id, JobStatus.REJECTED, adminId);
  }

  @Delete('bulk')
  @ApiOperation({ summary: 'Xóa hàng loạt dựa trên bộ lọc' })
  removeBulk(@Query() query: AdminFilterJobPostingDto) {
    return this.jobPostingsService.removeBulk(query);
  }

  @Patch('bulk-approve')
  @ApiOperation({ summary: 'Duyệt hàng loạt dựa trên bộ lọc' })
  bulkApprove(@Query() query: AdminFilterJobPostingDto, @CurrentUser('userId') adminId: string) {
    return this.jobPostingsService.updateStatusBulk(query, JobStatus.APPROVED, adminId);
  }

  @Post('sync-elasticsearch')
  @ApiOperation({ summary: 'Đồng bộ hóa tất cả tin đã duyệt vào Elasticsearch' })
  syncElasticsearch() {
    return this.jobPostingsService.syncAllJobsToES();
  }
}
