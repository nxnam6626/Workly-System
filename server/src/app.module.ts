import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { SearchModule } from './search/search.module';
import { CrawlSourceModule } from './crawl-source/crawl-source.module';
import { CrawlerModule } from './crawler/crawler.module';
import { FilterRuleModule } from './filter-rule/filter-rule.module';
import { ScheduleModule } from '@nestjs/schedule';
import { RapidJobModule } from './rapid-job/rapid-job.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
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
export class AppModule {}
