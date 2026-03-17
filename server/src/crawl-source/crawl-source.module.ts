import { Module } from '@nestjs/common';
import { CrawlSourceService } from './crawl-source.service';
import { CrawlSourceController } from './crawl-source.controller';

@Module({
  providers: [CrawlSourceService],
  controllers: [CrawlSourceController]
})
export class CrawlSourceModule {}
