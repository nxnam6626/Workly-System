import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RapidJobService } from './rapid-job.service';
import { lastValueFrom } from 'rxjs';

@ApiTags('Rapid Job Test')
@Controller('rapid-job')
export class RapidJobController {
    constructor(private readonly rapidJobService: RapidJobService) { }

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

    @Get('jpf')
    @ApiOperation({ summary: 'Test Job Posting Feed API' })
    @ApiQuery({ name: 'limit', required: false, example: '10' })
    async testJPF(@Query('limit') limit: string = '10') {
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchJobPostingFeed(parseInt(limit)),
        );
        return rawJobs.map((job) => this.rapidJobService.mapJPFToJob(job));
    }
}
