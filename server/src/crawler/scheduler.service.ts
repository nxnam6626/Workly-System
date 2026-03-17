import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../prisma/prisma.service';
import { CrawlerService } from './crawler.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crawlerService: CrawlerService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly searchService: SearchService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing dynamic cron jobs for crawl sources...');
    await this.loadCronJobs();
  }

  async loadCronJobs() {
    // Delete existing jobs first
    const jobs = this.schedulerRegistry.getCronJobs();
    jobs.forEach((value, key) => {
      if (key.startsWith('crawl_source_')) {
        this.schedulerRegistry.deleteCronJob(key);
      }
    });

    const sources = await this.prisma.crawlSource.findMany({
      where: { isActive: true },
      include: { crawlConfig: true },
    });

    for (const source of sources) {
      if (source.crawlConfig?.schedule) {
        this.addCronJob(source);
      }
    }
    
    this.logger.log(`Loaded ${sources.length} active cron jobs.`);
  }

  addCronJob(source: any) {
    const jobName = `crawl_source_${source.crawlSourceId}`;
    try {
      const job = new CronJob(source.crawlConfig.schedule, async () => {
        await this.executeCrawl(source);
      });

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();
      
      this.logger.log(`Job ${jobName} added with schedule: ${source.crawlConfig.schedule}`);
    } catch (e) {
      this.logger.error(`Error adding cron job for source ${source.sourceName}: ${e.message}`);
    }
  }

  async executeCrawl(source: any) {
    this.logger.log(`Executing crawl for source: ${source.sourceName}`);
    
    // 1. Create CrawlLog (RUNNING)
    const crawlLog = await this.prisma.crawlLog.create({
      data: {
        status: 'RUNNING',
        crawlSourceId: source.crawlSourceId,
      }
    });

    try {
      // 2. Execute Crawl
      const config = {
        baseUrl: source.baseUrl,
        titleSelector: source.crawlConfig.titleSelector,
        salarySelector: source.crawlConfig.salarySelector,
        descriptionSelector: source.crawlConfig.descriptionSelector,
        renderJs: source.crawlConfig.renderJs,
      };

      const items = await this.crawlerService.testCrawl(config);
      
      // Fetch filter rules
      const filterRules = await this.prisma.filterRule.findMany({
        where: { crawlSourceId: source.crawlSourceId }
      });
      const excludeKeywords = filterRules.filter(r => r.action === 'EXCLUDE').map(r => r.keyword.toLowerCase());
      const minScoreRule = filterRules.find(r => r.minReliabilityScore !== null);
      const minScore = minScoreRule?.minReliabilityScore ?? 0;

      // Ensure a company exists
      let defaultCompany = await this.prisma.company.findFirst({ where: { companyName: 'Workly Crawler' } });
      if (!defaultCompany) {
        defaultCompany = await this.prisma.company.create({
          data: {
            companyName: 'Workly Crawler',
            description: 'Default company for crawled jobs',
          }
        });
      }

      let processedCount = 0;

      for (const item of items) {
        // Calculate AI Reliability Score
        let score = 0;
        if (item.title) score += 3;
        if (item.salary && item.salary !== 'Thoả thuận') score += 3;
        if (item.description) score += 4;

        if (score < minScore) continue;

        // Keyword filter
        const textToSearch = `${item.title} ${item.description}`.toLowerCase();
        const containsExclude = excludeKeywords.some(kw => textToSearch.includes(kw));
        if (containsExclude) continue;

        // Upsert
        const upsertedJob = await this.prisma.jobPosting.upsert({
          where: {
            originalUrl_crawlSourceId: {
              originalUrl: item.originalUrl,
              crawlSourceId: source.crawlSourceId,
            }
          },
          update: {
            title: item.title,
            description: item.description,
            aiReliabilityScore: score,
          },
          create: {
            title: item.title,
            description: item.description,
            originalUrl: item.originalUrl,
            aiReliabilityScore: score,
            crawlSourceId: source.crawlSourceId,
            companyId: defaultCompany.companyId,
            status: 1,
            postType: 'CRAWLED',
          }
        });

        // Index to Elasticsearch
        await this.searchService.indexJob({
          id: upsertedJob.jobPostingId,
          title: upsertedJob.title,
          description: upsertedJob.description || undefined,
          companyId: upsertedJob.companyId,
          crawlSourceId: upsertedJob.crawlSourceId || undefined,
          originalUrl: upsertedJob.originalUrl || undefined,
        });

        processedCount++;
      }
      
      // 3. Update CrawlLog (SUCCESS)
      await this.prisma.crawlLog.update({
        where: { crawlLogId: crawlLog.crawlLogId },
        data: {
          status: 'SUCCESS',
          endTime: new Date(),
          itemsProcessed: processedCount,
        }
      });
      
      // Update CrawlSource lastCrawlAt
      await this.prisma.crawlSource.update({
        where: { crawlSourceId: source.crawlSourceId },
        data: { lastCrawlAt: new Date() }
      });

      this.logger.log(`Successfully crawled ${items.length} items from ${source.sourceName}`);
    } catch (error) {
      // 4. Update CrawlLog (FAILED)
      await this.prisma.crawlLog.update({
        where: { crawlLogId: crawlLog.crawlLogId },
        data: {
          status: 'FAILED',
          endTime: new Date(),
          errorMessage: error.message,
        }
      });
      this.logger.error(`Failed to crawl ${source.sourceName}`, error.stack);
    }
  }
}
