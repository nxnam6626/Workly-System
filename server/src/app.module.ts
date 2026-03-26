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
import { ScheduleModule } from '@nestjs/schedule';
import { RapidJobModule } from './modules/jobs/rapid-job/rapid-job.module';
import { JobPostingsModule } from './modules/jobs/job-postings/job-postings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule, JobPostingsModule,
    RedisModule,
    MailModule,
    SearchModule,
    ScheduleModule.forRoot(),
    RapidJobModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
