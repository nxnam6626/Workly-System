import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { RedisModule } from '@/redis/redis.module';
import { MailModule } from '@/mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from '@/common/supabase/supabase.module';

// Identity
import { UsersModule } from '@/modules/identity/users/users.module';
import { AuthModule } from '@/modules/identity/auth/auth.module';
import { AdminModule } from '@/modules/identity/admin/admin.module';

// Profiles
import { CandidatesModule } from '@/modules/profiles/candidates/candidates.module';
import { RecruitersModule } from '@/modules/profiles/recruiters/recruiters.module';
import { CompaniesModule } from '@/modules/profiles/companies/companies.module';

// Core Jobs
import { JobPostingsModule } from '@/modules/core-jobs/jobs/job-postings/job-postings.module';
import { ApplicationsModule } from '@/modules/core-jobs/applications/applications.module';
import { FavoritesModule } from '@/modules/core-jobs/favorites/favorites.module';

// Intelligence
import { AiModule } from '@/modules/intelligence/ai/ai.module';
import { MatchingEngineModule } from '@/modules/intelligence/matching-engine/matching-engine.module';
import { SearchModule } from '@/modules/intelligence/search/search.module';

// Communication
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';

// Billing
import { WalletsModule } from '@/modules/billing/wallets/wallets.module';
import { SubscriptionsModule } from '@/modules/billing/subscriptions/subscriptions.module';

// Support
import { SupportModule } from '@/modules/support/support/support.module';

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
    MatchingEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
