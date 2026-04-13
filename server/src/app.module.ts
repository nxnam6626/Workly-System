import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { SearchModule } from './modules/search/search.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobPostingsModule } from './modules/jobs/job-postings/job-postings.module';
import { CompaniesModule } from './modules/companies/companies.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { CandidatesModule } from './modules/candidates/candidates.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RecruitersModule } from './modules/recruiters/recruiters.module';
import { AiModule } from './modules/ai/ai.module';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from './common/supabase/supabase.module';

import { WalletsModule } from './modules/wallets/wallets.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SupportModule } from './modules/support/support.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    JobPostingsModule,
    RedisModule,
    MailModule,
    SearchModule,
    ScheduleModule.forRoot(),
    CompaniesModule,
    ApplicationsModule,
    FavoritesModule,
    AiModule,
    CandidatesModule,
    MessagesModule,
    AdminModule,
    NotificationsModule,
    RecruitersModule,
    WalletsModule,
    SupabaseModule,
    SubscriptionsModule,
    SupportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
