import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { JobStatus, PostType } from '@prisma/client';
import { Observable } from 'rxjs';

// Interfaces
import { JSearchResponse, MappedJobData } from './interfaces/rapid-job.interface';

// Providers
import { JSearchProvider } from './providers/jsearch.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { LinkedInV2Provider } from './providers/linkedin-v2.provider';
import { JPFProvider } from './providers/jpf.provider';

// Services
import { JobSyncService } from './services/job-sync.service';

@Injectable()
export class RapidJobService {
  private readonly logger = new Logger(RapidJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jsearchProvider: JSearchProvider,
    private readonly linkedinProvider: LinkedInProvider,
    private readonly linkedinV2Provider: LinkedInV2Provider,
    private readonly jpfProvider: JPFProvider,
    private readonly jobSyncService: JobSyncService,
  ) { }

  // =========================================================================
  //  API FETCHERS (Delegated to Providers)
  // =========================================================================

  fetchJSearchJobs(query: string): Observable<JSearchResponse> {
    return this.jsearchProvider.fetchJobs({ query });
  }

  fetchLinkedInJobs(title: string): Observable<any[]> {
    return this.linkedinProvider.fetchJobs({ title });
  }

  fetchLinkedInJobsV2(): Observable<any[]> {
    return this.linkedinV2Provider.fetchJobs();
  }

  fetchJobPostingFeed(): Observable<any[]> {
    return this.jpfProvider.fetchJobs();
  }

  // =========================================================================
  //  URL EXTRACTORS (Delegated to Providers)
  // =========================================================================

  extractJSearchUrlAndDesc(apiData: any) { return this.jsearchProvider.extractUrlAndDesc(apiData); }
  extractLinkedInUrlAndDesc(apiData: any) { return this.linkedinProvider.extractUrlAndDesc(apiData); }
  extractLinkedInV2UrlAndDesc(apiData: any) { return this.linkedinV2Provider.extractUrlAndDesc(apiData); }
  extractJPFUrlAndDesc(apiData: any) { return this.jpfProvider.extractUrlAndDesc(apiData); }

  // =========================================================================
  //  MAPPERS (Delegated to Providers)
  // =========================================================================

  async mapJSearchToJob(apiData: any, llmData: any = null): Promise<MappedJobData> {
    return this.jsearchProvider.mapToJobData(apiData, llmData);
  }

  mapLinkedInToJob(apiData: any, llmData: any = null): MappedJobData {
    return this.linkedinProvider.mapToJobData(apiData, llmData);
  }

  mapLinkedInV2ToJob(apiData: any, llmData: any = null): MappedJobData {
    return this.linkedinV2Provider.mapToJobData(apiData, llmData);
  }

  mapJPFToJob(apiData: any, llmData: any = null): MappedJobData {
    return this.jpfProvider.mapToJobData(apiData, llmData);
  }

  // =========================================================================
  //  DATABASE SYNC (Delegated to JobSyncService)
  // =========================================================================

  async syncJobToDb(mappedData: MappedJobData, reliabilityScore: number, providerName?: string) {
    return this.jobSyncService.syncJobToDb(mappedData, reliabilityScore);
  }

  // =========================================================================
  //  STATISTICS
  // =========================================================================

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalToday, totalMonth] = await Promise.all([
      this.prisma.jobPosting.count({
        where: { postType: PostType.CRAWLED, createdAt: { gte: today } },
      }),
      this.prisma.jobPosting.count({
        where: { postType: PostType.CRAWLED, createdAt: { gte: startOfMonth } },
      }),
    ]);
    const activeSources = 4;

    return { totalToday, totalMonth, activeSources };
  }

  // =========================================================================
  //  CRAWL LOGS
  // =========================================================================

  async findAllLogs() {
    return this.prisma.crawlLog.findMany({
      orderBy: { startTime: 'desc' },
      take: 100,
    });
  }

  async deleteLog(id: string) {
    return this.prisma.crawlLog.delete({
      where: { crawlLogId: id },
    });
  }
}
