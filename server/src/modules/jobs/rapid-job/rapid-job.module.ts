import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RapidJobService } from './rapid-job.service';
import { RapidJobController } from './rapid-job.controller';
import { AdminCrawlLogsController } from './admin-crawl-logs.controller';
import { RapidJobSchedulerService } from './rapid-job-scheduler.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { SearchModule } from '../../search/search.module';

// Providers
import { JSearchProvider } from './providers/jsearch.provider';
import { LinkedInProvider } from './providers/linkedin.provider';
import { LinkedInV2Provider } from './providers/linkedin-v2.provider';
import { JPFProvider } from './providers/jpf.provider';

// Services
import { JobSyncService } from './services/job-sync.service';
import { LlmExtractionService } from './services/llm-extraction.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    SearchModule,
  ],
  controllers: [RapidJobController, AdminCrawlLogsController],
  providers: [
    RapidJobService,
    RapidJobSchedulerService,
    JSearchProvider,
    LinkedInProvider,
    LinkedInV2Provider,
    JPFProvider,
    JobSyncService,
    LlmExtractionService,
  ],
  exports: [RapidJobService],
})
export class RapidJobModule { }
