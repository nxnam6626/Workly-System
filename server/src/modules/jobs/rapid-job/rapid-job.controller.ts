import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RapidJobService } from './rapid-job.service';
import { RapidJobSchedulerService } from './rapid-job-scheduler.service';
import { lastValueFrom } from 'rxjs';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { Role } from '@/modules/auth/decorators/roles.decorator';

@ApiTags('Rapid Job Management')
@Controller('rapid-job')
export class RapidJobController {
    constructor(
        private readonly rapidJobService: RapidJobService,
        private readonly rapidJobSchedulerService: RapidJobSchedulerService,
    ) { }

    @Get('search')
    @ApiOperation({ summary: 'Test JSearch API' })
    @ApiQuery({ name: 'q', required: true, example: 'intern' })
    @ApiQuery({ name: 'page', required: false, example: '1' })
    @ApiQuery({ name: 'country', required: false, example: 'vn' })
    @ApiQuery({ name: 'date_posted', required: false, example: 'all' })
    async testSearch(
        @Query('q') q: string,
        @Query('page') page: string = '1',
        @Query('country') country: string = 'vn',
        @Query('date_posted') datePosted: string = 'all',
    ) {
        const response = await lastValueFrom(
            this.rapidJobService.fetchJSearchJobs(
                q,
                parseInt(page),
                country,
                datePosted,
            ),
        );
        return response.data.map((job) => this.rapidJobService.mapJSearchToJob(job));
    }

    @Get('linkedin')
    @ApiOperation({ summary: 'Test LinkedIn Job Search API' })
    @ApiQuery({ name: 'q', required: true, example: 'intern' })
    @ApiQuery({ name: 'location', required: false, example: 'Vietnam' })
    async testLinkedIn(
        @Query('q') q: string,
        @Query('location') location: string = 'Vietnam',
    ) {
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchLinkedInJobs(q, location, 10),
        );
        return rawJobs.map((job) => this.rapidJobService.mapLinkedInToJob(job));
    }

    @Get('linkedin-v2')
    @ApiOperation({ summary: 'Test LinkedIn V2 Job Search API (7-day)' })
    @ApiQuery({ name: 'q', required: true, example: 'Data Engineer' })
    @ApiQuery({ name: 'location', required: false, example: 'United States' })
    async testLinkedInV2(
        @Query('q') q: string,
        @Query('location') location: string = 'United States',
    ) {
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchLinkedInJobsV2(q, location),
        );
        return rawJobs.map((job) => this.rapidJobService.mapLinkedInV2ToJob(job));
    }

    @Get('jpf')
    @ApiOperation({ summary: 'Test Job Posting Feed API' })
    @ApiQuery({ name: 'limit', required: false, example: '10' })
    async testJPF(@Query('limit') limit: string = '10') {
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchJobPostingFeed(parseInt(limit)),
        );
        return rawJobs.map((job) => this.rapidJobService.mapJPFToJob(job));
    }

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
}
