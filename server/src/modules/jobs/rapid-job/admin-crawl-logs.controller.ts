import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RapidJobService } from './rapid-job.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';

@ApiTags('Admin Crawl Logs')
@Controller('admin/crawl-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminCrawlLogsController {
  constructor(private readonly rapidJobService: RapidJobService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách log cào tin' })
  async findAll() {
    return this.rapidJobService.findAllLogs();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa log cào tin' })
  async remove(@Param('id') id: string) {
    return this.rapidJobService.deleteLog(id);
  }
}
