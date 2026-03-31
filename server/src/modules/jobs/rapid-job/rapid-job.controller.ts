import { Controller, Get, Post, Query, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RapidJobService } from './rapid-job.service';
import { JSearchResponse, MappedJobData } from './interfaces/rapid-job.interface';
import { RapidJobSchedulerService } from './rapid-job-scheduler.service';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Role, Roles } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Rapid Job Management')
@Controller('rapid-job')
export class RapidJobController {
    private readonly logger = new Logger(RapidJobController.name);

    constructor(
        private readonly rapidJobService: RapidJobService,
        private readonly rapidJobSchedulerService: RapidJobSchedulerService,
    ) { }


    @Post('crawl/jsearch')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Manually trigger JSearch crawl' })
    async triggerJSearch() {
        await this.rapidJobSchedulerService.handleJSearchAutoCrawl();
        return { message: 'JSearch crawl triggered successfully' };
    }

    @Post('crawl/linkedin')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Manually trigger LinkedIn crawl' })
    async triggerLinkedIn() {
        await this.rapidJobSchedulerService.handleLinkedInAutoCrawl();
        return { message: 'LinkedIn crawl triggered successfully' };
    }

    @Post('crawl/linkedin-v2')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Manually trigger LinkedIn V2 crawl' })
    async triggerLinkedInV2() {
        await this.rapidJobSchedulerService.handleLinkedInV2AutoCrawl();
        return { message: 'LinkedIn V2 crawl triggered successfully' };
    }

    @Post('crawl/jpf')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Manually trigger JPF crawl' })
    async triggerJPF() {
        await this.rapidJobSchedulerService.handleJPFAutoCrawl();
        return { message: 'JPF crawl triggered successfully' };
    }

    @Get('stats')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Lấy dữ liệu thống kê số lượng tin tuyển dụng đã thu thập' })
    async getStats() {
        return this.rapidJobService.getStats();
    }

    @Post('save-preview')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: 'Lưu công việc được xem trước vào CSDL' })
    async savePreview(@Body() body: { jobs: any[]; providerId: string }) {
        return this.rapidJobSchedulerService.savePreviewedBatch(body.jobs, body.providerId);
    }
}
