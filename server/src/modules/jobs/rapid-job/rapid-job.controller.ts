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

    @Get('jsearch')
    @ApiOperation({ summary: 'Test JSearch API' })
    @ApiQuery({ name: 'q', required: true, example: 'intern' })
    @ApiQuery({ name: 'page', required: false, example: '1' })
    @ApiQuery({ name: 'country', required: false, example: 'vn' })
    @ApiQuery({ name: 'date_posted', required: false, example: 'today' })
    @ApiQuery({ name: 'ai', required: false, type: Boolean, description: 'Có gọi AI (Gemini) để trích xuất không?' })
    async testJSearch(
        @Query('q') q: string,
        @Query('page') page: string = '1',
        @Query('country') country: string = 'vn',
        @Query('date_posted') datePosted: string = 'today',
        @Query('ai') ai: string = 'true',
    ) {
        if (!q) {
            return { message: 'Tham số "q" là bắt buộc' };
        }
        const useAi = ai !== 'false';
        this.logger.log(`\n=== [TEST BẮT ĐẦU] Tìm kiếm JSearch: "${q}" (AI: ${useAi ? 'BẬT' : 'TẮT'}) ===`);
        
        const response = await lastValueFrom(
            this.rapidJobService.fetchJSearchJobs(
                q,
                parseInt(page),
                country,
                datePosted,
            ),
        );

        const items = response.data || [];
        this.logger.log(`[Test] Nhận được ${items.length} tin. Bắt đầu xử lý từng tin...\n`);
        
        const results: MappedJobData[] = [];
        for (let i = 0; i < items.length; i++) {
            const rawItem = items[i];
            const title = rawItem.job_title || 'Không tiêu đề';
            this.logger.log(`--- [Tin số ${i + 1}/${items.length}] : ${title} ---`);
            
            let llmData: any = null;
            if (useAi) {
                const { rawDescription } = this.rapidJobService.extractJSearchUrlAndDesc(rawItem);
                // __CHẨN ĐOÁN: Hiển thị dữ liệu thô để kiểm tra
                this.logger.debug(`[RAW ITEM KEYS]: ${Object.keys(rawItem).join(', ')}`);
                this.logger.debug(`[RAW job_description snippet]: "${String(rawItem.job_description || '(TRỐNG)').substring(0, 100)}"`);
                this.logger.log(`[AI] Đang yêu cầu Gemini phân tích mô tả (${rawDescription.length} ký tự)...`);
                llmData = await (this.rapidJobSchedulerService as any).llmExtractionService.extract(rawDescription);
                if (llmData) {
                    this.logger.log(`[AI Success] Đã nhận kết quả từ Gemini.`);
                }
            }

            const mapped = await this.rapidJobService.mapJSearchToJob(rawItem, llmData);
            this.logger.log(`[Mapped]: ${mapped.jobData.title} | Lương: ${mapped.jobData.salaryMin}-${mapped.jobData.salaryMax}`);
            results.push(mapped);
        }

        this.logger.log(`\n=== [TEST KẾT THÚC] ===\n`);
        return results;
    }

    @Get('linkedin')
    @ApiOperation({ summary: 'Test LinkedIn Job Search API' })
    @ApiQuery({ name: 'q', required: true, example: 'intern' })
    @ApiQuery({ name: 'location', required: false, example: 'Vietnam' })
    async testLinkedIn(
        @Query('q') q: string,
        @Query('location') location: string = 'Vietnam',
    ) {
        this.logger.log(`[Test] Đang lấy tin từ LinkedIn: "${q}" tại ${location}`);
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchLinkedInJobs(q, location, 10),
        );
        this.logger.log(`[Test] Nhận được ${rawJobs.length} tin từ LinkedIn API.`);
        return rawJobs.map((job) => this.rapidJobService.mapLinkedInToJob(job, null));
    }

    @Get('linkedin-v2')
    @ApiOperation({ summary: 'Test LinkedIn V2 Job Search API (7-day)' })
    @ApiQuery({ name: 'q', required: true, example: 'Data Engineer' })
    @ApiQuery({ name: 'location', required: false, example: 'United States' })
    async testLinkedInV2(
        @Query('q') q: string,
        @Query('location') location: string = 'Vietnam',
    ) {
        this.logger.log(`[Test] Đang lấy tin từ LinkedIn V2: "${q}" tại ${location}`);
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchLinkedInJobsV2(q, location),
        );
        this.logger.log(`[Test] Nhận được ${rawJobs.length} tin từ LinkedIn V2 API.`);
        return rawJobs.map((job) => this.rapidJobService.mapLinkedInV2ToJob(job, null));
    }

    @Get('jpf')
    @ApiOperation({ summary: 'Test Job Posting Feed API' })
    @ApiQuery({ name: 'limit', required: false, example: '10' })
    async testJPF(@Query('limit') limit: string = '10') {
        this.logger.log(`[Test] Đang lấy tin từ JPF (giới hạn: ${limit})`);
        const rawJobs = await lastValueFrom(
            this.rapidJobService.fetchJobPostingFeed(parseInt(limit)),
        );
        this.logger.log(`[Test] Nhận được ${rawJobs.length} tin từ JPF API.`);
        return rawJobs.map((job) => this.rapidJobService.mapJPFToJob(job, null));
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
