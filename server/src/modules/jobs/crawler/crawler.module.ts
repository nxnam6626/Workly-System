import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CrawlerService } from './crawler.service';
import { CrawlerController } from './crawler.controller';
import { SchedulerService } from './scheduler.service';

@Module({
  imports: [HttpModule],
  providers: [CrawlerService, SchedulerService],
  controllers: [CrawlerController],
  exports: [CrawlerService]
})
export class CrawlerModule {}
