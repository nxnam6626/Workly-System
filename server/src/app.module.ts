import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { SearchModule } from './modules/search/search.module';
import { CrawlSourceModule } from './modules/jobs/crawl-source/crawl-source.module';
import { CrawlerModule } from './modules/jobs/crawler/crawler.module';
import { FilterRuleModule } from './modules/jobs/filter-rule/filter-rule.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RapidJobModule } from './modules/jobs/rapid-job/rapid-job.module';
import { JobPostingsModule } from './job-postings/job-postings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule, JobPostingsModule,
    RedisModule,
    MailModule,
    SearchModule,
    CrawlSourceModule,
    CrawlerModule,
    FilterRuleModule,
    ScheduleModule.forRoot(),
    RapidJobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
