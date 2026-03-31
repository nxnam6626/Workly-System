import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RapidJobService } from './rapid-job.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { SearchService } from '../../search/search.service';
import { LlmExtractionService } from './services/llm-extraction.service';
import { lastValueFrom } from 'rxjs';
import { MappedJobData } from './interfaces/rapid-job.interface';
import { Role } from '../../auth/decorators/roles.decorator';
import {
  JSEARCH_WEEKLY_SCHEDULE,
  LINKEDIN_LETSCRAPE_SCHEDULE,
} from './rapid-job.config';

// ─── Độ tin cậy theo nguồn (aiReliabilityScore) ─────────────────────────────
const RELIABILITY: Record<string, number> = {
  LinkedIn: 8,
  LinkedInV2: 8,
  JSearch: 6,
  JPF: 5,
};

@Injectable()
export class RapidJobSchedulerService {
  private readonly logger = new Logger(RapidJobSchedulerService.name);

  constructor(
    private readonly rapidJobService: RapidJobService,
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly llmExtractionService: LlmExtractionService,
  ) { }

  // =========================================================================
  //  CRON JOBS
  // =========================================================================

  /**
   * JSearch — 6 queries/ngày, xoay vòng chủ đề theo thứ trong tuần.
   * Cron: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 → 6 lần/ngày = 180 req/tháng
   */
  @Cron('0 */4 * * *')
  async handleJSearchAutoCrawl() {
    const day = new Date().getDay(); // 0=CN … 6=T7
    const plan = JSEARCH_WEEKLY_SCHEDULE[day] ?? JSEARCH_WEEKLY_SCHEDULE[1];
    this.logger.log(`[JSearch] Ngày ${day} | Chủ đề: ${plan.theme} | ${plan.queries.length} truy vấn`);

    for (const { query, label } of plan.queries) {
      try {
        const response = await lastValueFrom(
          this.rapidJobService.fetchJSearchJobs(query),
        );
        const items = response?.data ?? [];
        if (!items.length) {
          this.logger.debug(`[JSearch:${label}] Không có kết quả cho "${query}"`);
          continue;
        }
        await this.processBatch(
          items,
          (item) => this.rapidJobService.extractJSearchUrlAndDesc(item),
          (item, llmData) => this.rapidJobService.mapJSearchToJob(item, llmData),
          `JSearch:${label}`,
          RELIABILITY.JSearch,
        );
      } catch (err) {
        this.logger.warn(`[JSearch:${label}] Query "${query}" thất bại: ${err.message}`);
      }
    }
  }

  /**
   * LinkedIn Letscrape — 1 req/ngày, xoay title theo thứ T2-T7.
   * Cron: 09:00 mỗi ngày → 25 req/tháng (Chủ nhật nghỉ)
   */
  @Cron('0 9 * * 1-6')
  async handleLinkedInAutoCrawl() {
    const day = new Date().getDay();
    const title = LINKEDIN_LETSCRAPE_SCHEDULE[day];

    if (!title) {
      this.logger.log(`[LinkedIn Letscrape] Ngày ${day} là Chủ nhật → Bỏ qua để tiết kiệm quota`);
      return;
    }

    this.logger.log(`[LinkedIn Letscrape] Ngày ${day} | Tiêu đề: "${title}"`);

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchLinkedInJobs(title),
      );
      if (!items?.length) {
        this.logger.debug(`[LinkedIn Letscrape] Không có kết quả`);
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.extractLinkedInUrlAndDesc(item),
        async (item, llmData) => this.rapidJobService.mapLinkedInToJob(item, llmData),
        'LinkedIn Letscrape',
        RELIABILITY.LinkedIn,
      );
    } catch (err) {
      this.logger.error(`[LinkedIn Letscrape] Crawl thất bại: ${err.message}`);
    }
  }

  /**
   * LinkedIn Fantastic — 5 req/tháng, quét số lượng lớn (100).
   * Cron: 08:00 sáng Thứ 2 hàng tuần (0 8 * * 1)
   */
  @Cron('0 8 * * 1')
  async handleLinkedInV2AutoCrawl() {
    this.logger.log(`[LinkedIn Fantastic] Quét số lượng lớn hàng tuần | Bộ lọc: intern/internship/thực tập @ Vietnam`);

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchLinkedInJobsV2(),
      );
      if (!items?.length) {
        this.logger.debug(`[LinkedIn Fantastic] Không có kết quả`);
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.extractLinkedInV2UrlAndDesc(item),
        async (item, llmData) => this.rapidJobService.mapLinkedInV2ToJob(item, llmData),
        'LinkedIn Fantastic',
        RELIABILITY.LinkedInV2,
      );
    } catch (err) {
      this.logger.error(`[LinkedIn Fantastic] Crawl thất bại: ${err.message}`);
    }
  }

  /**
   * Job Posting Feed — 1 req/tuần (Chủ Nhật), lấy 500 tin ngành kỹ thuật/dịch vụ/giáo dục.
   * Cron: 10:00 Chủ Nhật → 4 req/tháng (dư 1 dự phòng trong quota 5)
   */
  @Cron('0 10 * * 0')
  async handleJPFAutoCrawl() {
    this.logger.log(`[JPF] Quét hàng tuần | Bộ lọc: AI Intern filter @ Vietnam`);

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchJobPostingFeed(),
      );
      if (!items?.length) {
        this.logger.debug('[JPF] Không có kết quả');
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.extractJPFUrlAndDesc(item),
        async (item, llmData) => this.rapidJobService.mapJPFToJob(item, llmData),
        'JPF',
        RELIABILITY.JPF,
      );
    } catch (err) {
      this.logger.error(`[JPF] Crawl thất bại: ${err.message}`);
    }
  }

  // =========================================================================
  //  CORE BATCH PROCESSOR
  // =========================================================================

  /**
   * Xử lý một batch raw items từ API:
   *  1. Map từng item → MappedJobData
   *  2. syncJobToDb() → Prisma $transaction (company find-or-create + job upsert)
   *  3. Index vào Elasticsearch
   */
  private async processBatch(
    rawItems: any[],
    extractor: (item: any) => { originalUrl: string, rawDescription: string },
    mapper: (item: any, llmData: any) => Promise<MappedJobData>,
    sourceName: string,
    reliabilityScore: number,
  ) {
    let saved = 0;
    let skipped = 0;

    this.logger.log(`\n=== BẮT ĐẦU XỬ LÝ BATCH [${sourceName}] : ${rawItems.length} tin ===`);

    // ── Lớp 1: Lấy URL để check trùng hàng loạt ──
    const extractions = rawItems.map(item => ({ item, ...extractor(item) }));
    const urls = extractions.map(e => e.originalUrl).filter(Boolean);
    const existingJobs = await this.prisma.jobPosting.findMany({
      where: { originalUrl: { in: urls } },
      select: { originalUrl: true }
    });
    const existingSet = new Set(existingJobs.map(j => j.originalUrl));

    // ── Xử lý tuần tự từng tin để log chi tiết ──
    for (let i = 0; i < extractions.length; i++) {
      const e = extractions[i];
      const jobTitle = e.item.job_title || e.item.title || 'Không rõ tiêu đề';
      this.logger.log(`[Tin ${i + 1}/${extractions.length}] : ${jobTitle}`);

      // 1. Kiểm tra trùng
      if (!e.originalUrl || existingSet.has(e.originalUrl)) {
        this.logger.log(`   -> [Lớp 1] Bỏ qua: Tin đã tồn tại hoặc thiếu URL.`);
        skipped++;
        continue;
      }

      // 2. Kiểm tra nội dung (Lọc rác)
      if (!e.rawDescription || e.rawDescription.trim().length < 50) {
        this.logger.log(`   -> [Lớp 2] Bỏ qua: Nội dung quá ngắn hoặc rác (< 50 ký tự).`);
        skipped++;
        continue;
      }

      // 3. Xử lý AI & Lưu DB
      try {
        this.logger.log(`   -> [Lớp 3] Đang gọi AI Gemini để trích xuất...`);
        const llmData = await this.llmExtractionService.extract(e.rawDescription);

        if (llmData) {
          this.logger.log(`   -> [AI] Trích xuất thành công JSON (Lương: ${llmData.salaryMin}-${llmData.salaryMax})`);
        } else {
          this.logger.warn(`   -> [AI] Gemini không trích xuất được dữ liệu.`);
        }

        const mapped = await mapper(e.item, llmData);
        const job = await this.rapidJobService.syncJobToDb(mapped, reliabilityScore, sourceName);

        if (job) {
          await this.searchService.indexJob({
            id: job.jobPostingId,
            title: job.title,
            description: job.description || undefined,
            companyId: job.companyId,
            companyName: job.company?.companyName || undefined,
            originalUrl: job.originalUrl || undefined,
            locationCity: job.locationCity || undefined,
            jobType: job.jobType || undefined,
            experience: job.experience || undefined,
            salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
            salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
            status: job.status,
            createdAt: job.createdAt,
          });
          saved++;
          this.logger.log(`   -> [Thành công] Đã lưu mã: ${job.jobPostingId}`);
        }
      } catch (err) {
        skipped++;
        this.logger.error(`   -> [Lỗi] Không thể xử lý tin này: ${err.message}`);
      }
    }

    this.logger.log(`=== KẾT THÚC BATCH : Đã lưu ${saved} | Bỏ qua ${skipped} ===\n`);
  }

  // =========================================================================
  //  MANUAL SAVE PREVIEW TO DB
  // =========================================================================

  /**
   * Cho phép Admin lưu các job previewed ngay lập tức vào database 
   * tái sử dụng cơ chế dedup, mapping và elasticsearch indexing chuẩn.
   */
  async savePreviewedBatch(jobs: any[], providerId: string) {
    const scoreMap: Record<string, number> = {
      'linkedin': 8,
      'linkedin-v2': 8,
      'jsearch': 6,
      'jpf': 5,
    };
    const reliabilityScore = scoreMap[providerId] || 5;
    let saved = 0;

    // Tạo 1 mock log đệm (tùy chọn nhưng tốt để lưu lịch sử thủ công)
    const crawlLog = await this.prisma.crawlLog.create({
      data: {
        status: 'RUNNING',
        providerName: providerId,
      }
    });

    for (const job of jobs) {
      try {
        const savedJob = await this.rapidJobService.syncJobToDb(
          job, // Tại frontend, job đã ở dạng mapped (MappedJobData)
          reliabilityScore,
          providerId,
        );

        if (savedJob) {
          await this.searchService.indexJob({
            id: savedJob.jobPostingId,
            title: savedJob.title,
            description: savedJob.description || undefined,
            companyId: savedJob.companyId,
            companyName: savedJob.company?.companyName || undefined,
            originalUrl: savedJob.originalUrl || undefined,
            locationCity: savedJob.locationCity || undefined,
            jobType: savedJob.jobType || undefined,
            experience: savedJob.experience || undefined,
            salaryMin: savedJob.salaryMin ? Number(savedJob.salaryMin) : undefined,
            salaryMax: savedJob.salaryMax ? Number(savedJob.salaryMax) : undefined,
            status: savedJob.status,
            createdAt: savedJob.createdAt,
          });
          saved++;
        }
      } catch (err) {
        this.logger.error(`Failed to save preview job: ${err.message}`);
      }
    }

    // Đánh dấu thành công log
    await this.prisma.crawlLog.update({
      where: { crawlLogId: crawlLog.crawlLogId },
      data: {
        status: 'SUCCESS',
        endTime: new Date(),
        itemsProcessed: saved,
      }
    });

    return { saved, total: jobs.length };
  }
}
