import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RapidJobService } from './rapid-job.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchService } from '../../search/search.service';
import { lastValueFrom } from 'rxjs';
import { Role } from '@/modules/auth/decorators/roles.decorator';
import {
  JSEARCH_WEEKLY_SCHEDULE,
  LINKEDIN_LETSCRAPE_SCHEDULE,
  LINKEDIN_BULK_QUERY,
  LINKEDIN_BULK_LIMIT,
  JPF_TITLE_FILTER,
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
    this.logger.log(`[JSearch] Ngày ${day} | Chủ đề: ${plan.theme} | ${plan.queries.length} queries`);

    const crawlSourceId = await this.getOrCreateCrawlSourceId();
    if (!crawlSourceId) return;

    for (const { query, label } of plan.queries) {
      try {
        const response = await lastValueFrom(
          this.rapidJobService.fetchJSearchJobs(query, 1, 'vn', 'today'),
        );
        const items = response?.data ?? [];
        if (!items.length) {
          this.logger.debug(`[JSearch:${label}] Không có kết quả cho "${query}"`);
          continue;
        }
        await this.processBatch(
          items,
          (item) => this.rapidJobService.mapJSearchToJob(item),
          crawlSourceId,
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
      this.logger.log(`[LinkedIn Letscrape] Ngày ${day} là Chủ nhật → Skip để tiết kiệm quota`);
      return;
    }

    this.logger.log(`[LinkedIn Letscrape] Ngày ${day} | Title: "${title}"`);

    const crawlSourceId = await this.getOrCreateCrawlSourceId();
    if (!crawlSourceId) return;

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchLinkedInJobs(title, 'Vietnam', 10),
      );
      if (!items?.length) {
        this.logger.debug(`[LinkedIn Letscrape] Không có kết quả`);
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.mapLinkedInToJob(item),
        crawlSourceId,
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
    this.logger.log(`[LinkedIn Fantastic] Weekly bulk crawl | Query: "${LINKEDIN_BULK_QUERY}"`);

    const crawlSourceId = await this.getOrCreateCrawlSourceId();
    if (!crawlSourceId) return;

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchLinkedInJobsV2(LINKEDIN_BULK_QUERY, 'Vietnam', LINKEDIN_BULK_LIMIT),
      );
      if (!items?.length) {
        this.logger.debug(`[LinkedIn Fantastic] Không có kết quả`);
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.mapLinkedInV2ToJob(item),
        crawlSourceId,
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
    this.logger.log(`[JPF] Weekly crawl | Filter: "${JPF_TITLE_FILTER.substring(0, 60)}..."`);

    const crawlSourceId = await this.getOrCreateCrawlSourceId();
    if (!crawlSourceId) return;

    try {
      const items = await lastValueFrom(
        this.rapidJobService.fetchJobPostingFeed(500, JPF_TITLE_FILTER),
      );
      if (!items?.length) {
        this.logger.debug('[JPF] Không có kết quả');
        return;
      }
      await this.processBatch(
        items,
        (item) => this.rapidJobService.mapJPFToJob(item),
        crawlSourceId,
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
    mapper: (item: any) => ReturnType<RapidJobService['mapJSearchToJob']>,
    crawlSourceId: string,
    sourceName: string,
    reliabilityScore: number,
  ) {
    let saved = 0;
    let skipped = 0;

    for (const item of rawItems) {
      try {
        const mapped = mapper(item);
        const job = await this.rapidJobService.syncJobToDb(
          mapped,
          crawlSourceId,
          reliabilityScore,
        );

        if (job) {
          // Đồng bộ vào search index (Elasticsearch)
          await this.searchService.indexJob({
            id: job.jobPostingId,
            title: job.title,
            description: job.description || undefined,
            companyId: job.companyId,
            originalUrl: job.originalUrl || undefined,
          });
          saved++;
        }
      } catch {
        skipped++;
        this.logger.debug(`[${sourceName}] Bỏ qua một item (lỗi hoặc không có URL)`);
      }
    }

    this.logger.log(
      `[${sourceName}] Đã lưu: ${saved} | Bỏ qua: ${skipped} | Tổng: ${rawItems.length}`,
    );
  }

  // =========================================================================
  //  SETUP HELPER — Khởi tạo CrawlSource nếu chưa có
  // =========================================================================

  /**
   * Tìm hoặc tạo record CrawlSource "RapidAPI Jobs".
   * CrawlSource dùng chung cho tất cả 3 API (JSearch / LinkedIn / JPF).
   * @returns crawlSourceId hoặc null nếu không tìm được admin
   */
  private async getOrCreateCrawlSourceId(): Promise<string | null> {
    // Kiểm tra đã tồn tại chưa
    const existing = await this.prisma.crawlSource.findFirst({
      where: { sourceName: 'RapidAPI Jobs' },
    });
    if (existing) return existing.crawlSourceId;

    // Tìm admin để gán
    let admin = await this.prisma.admin.findFirst();
    if (!admin) {
      const adminUser = await this.prisma.user.findFirst({
        where: {
          userRoles: {
            some: {
              role: {
                roleName: Role.ADMIN,
              },
            },
          },
        },
      });
      if (!adminUser) {
        this.logger.error('[Scheduler] Không tìm thấy ADMIN user để tạo CrawlSource.');
        return null;
      }
      admin = await this.prisma.admin.create({
        data: { userId: adminUser.userId, adminLevel: 1 },
      });
    }

    // Tạo CrawlConfig + CrawlSource
    const config = await this.prisma.crawlConfig.create({
      data: {
        titleSelector: 'N/A',
        descriptionSelector: 'N/A',
        schedule: '0 */4 * * *',
      },
    });

    const source = await this.prisma.crawlSource.create({
      data: {
        sourceName: 'RapidAPI Jobs',
        baseUrl: 'https://rapidapi.com',
        adminId: admin.adminId,
        crawlConfigId: config.crawlConfigId,
      },
    });

    this.logger.log(`[Scheduler] Tạo CrawlSource mới: ${source.crawlSourceId}`);
    return source.crawlSourceId;
  }
}
