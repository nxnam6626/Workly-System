import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RapidJobService } from './rapid-job.service';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchService } from '../../search/search.service';
import { lastValueFrom } from 'rxjs';
import { JobDto } from './dto/job.dto';

@Injectable()
export class RapidJobSchedulerService {
  private readonly logger = new Logger(RapidJobSchedulerService.name);

  constructor(
    private readonly rapidJobService: RapidJobService,
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {}

  /**
   * JSearch (200/tháng): Chạy mỗi 4 tiếng một lần.
   * Kết quả: 6 lần/ngày * 30 ngày = 180 lần/tháng.
   */
  @Cron('0 */4 * * *')
  async handleJSearchAutoCrawl() {
    this.logger.log('Starting scheduled JSearch crawl (Every 4 hours)...');
    try {
      const response = await lastValueFrom(
        this.rapidJobService.fetchJSearchJobs('internship', 1, 'vn', 'all'),
      );
      const jobs = response.data.map((item) =>
        this.rapidJobService.mapJSearchToJob(item),
      );
      await this.saveJobsToDatabase(jobs, 'JSearch');
    } catch (error) {
      this.logger.error(`Error in JSearch scheduled crawl: ${error.message}`);
    }
  }

  /**
   * LinkedIn Job Search (25/tháng): Chạy vào 9:00 sáng từ Thứ 2 đến Thứ 7 hàng tuần.
   * Kết quả: Khoảng 24-26 lần/tháng.
   */
  @Cron('0 9 * * 1-6')
  async handleLinkedInAutoCrawl() {
    this.logger.log(
      'Starting scheduled LinkedIn crawl (9:00 AM, Mon-Sat)...',
    );
    try {
      const rawJobs = await lastValueFrom(
        this.rapidJobService.fetchLinkedInJobs('intern', 'Vietnam', 10),
      );
      const jobs = rawJobs.map((item) =>
        this.rapidJobService.mapLinkedInToJob(item),
      );
      await this.saveJobsToDatabase(jobs, 'LinkedIn');
    } catch (error) {
      this.logger.error(`Error in LinkedIn scheduled crawl: ${error.message}`);
    }
  }

  /**
   * Job Posting Feed (5/tháng): Chạy vào 10:00 sáng Chủ Nhật hàng tuần.
   * Kết quả: 4-5 lần/tháng.
   */
  @Cron('0 10 * * 0')
  async handleJPFAutoCrawl() {
    this.logger.log(
      'Starting scheduled Job Posting Feed crawl (10:00 AM, Sunday)...',
    );
    try {
      const rawJobs = await lastValueFrom(
        this.rapidJobService.fetchJobPostingFeed(10),
      );
      const jobs = rawJobs.map((item) =>
        this.rapidJobService.mapJPFToJob(item),
      );
      await this.saveJobsToDatabase(jobs, 'JPF');
    } catch (error) {
      this.logger.error(`Error in JPF scheduled crawl: ${error.message}`);
    }
  }

  private async saveJobsToDatabase(jobs: JobDto[], sourceName: string) {
    // 1. Ensure a default company exists
    let defaultCompany = await this.prisma.company.findFirst({
      where: { companyName: 'Workly Crawler' },
    });

    if (!defaultCompany) {
      defaultCompany = await this.prisma.company.create({
        data: {
          companyName: 'Workly Crawler',
          description: 'Default company for crawled jobs',
        },
      });
    }

    // 2. Ensure a default CrawlSource for RapidAPI exists
    let rapidApiSource = await this.prisma.crawlSource.findFirst({
        where: { sourceName: 'RapidAPI Jobs' }
    });

    if (!rapidApiSource) {
        // Need an adminId and crawlConfigId for CrawlSource
        const admin = await this.prisma.admin.findFirst();
        if (!admin) {
            this.logger.error('No admin found to associate with RapidAPI CrawlSource');
            return;
        }

        const config = await this.prisma.crawlConfig.create({
            data: {
                titleSelector: 'N/A',
                descriptionSelector: 'N/A',
                schedule: '0 */4 * * *',
            }
        });

        rapidApiSource = await this.prisma.crawlSource.create({
            data: {
                sourceName: 'RapidAPI Jobs',
                baseUrl: 'https://rapidapi.com',
                adminId: admin.adminId,
                crawlConfigId: config.crawlConfigId,
            }
        });
    }

    let count = 0;
    for (const jobDto of jobs) {
      try {
        // Append salary to description because there's no salary column in JobPosting
        const fullDescription = `${jobDto.description}\n\nSalary: ${jobDto.salary}`;

        const job = await this.prisma.jobPosting.upsert({
          where: {
            originalUrl_crawlSourceId: {
              originalUrl: jobDto.applyUrl,
              crawlSourceId: rapidApiSource.crawlSourceId,
            },
          },
          update: {
            title: jobDto.title,
            description: fullDescription,
          },
          create: {
            title: jobDto.title,
            description: fullDescription,
            originalUrl: jobDto.applyUrl,
            companyId: defaultCompany.companyId,
            crawlSourceId: rapidApiSource.crawlSourceId,
            status: 1,
            postType: 'CRAWLED',
            aiReliabilityScore: 5,
          },
        });

        await this.searchService.indexJob({
          id: job.jobPostingId,
          title: job.title,
          description: job.description || undefined,
          companyId: job.companyId,
          originalUrl: job.originalUrl || undefined,
        });
        count++;
      } catch (e) {
        this.logger.debug(`Skipping duplicate or error job from ${sourceName}: ${jobDto.title}`);
      }
    }
    this.logger.log(`Processed ${count} jobs from ${sourceName}.`);
  }
}
