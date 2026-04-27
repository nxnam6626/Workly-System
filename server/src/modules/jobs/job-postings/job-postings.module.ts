import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { AdminJobPostingsController } from './admin-job-postings.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { MessagesModule } from '../../messages/messages.module';
import { NotificationsModule } from '../../notifications/notifications.module';
import { JobAlertsModule } from '../../job-alerts/job-alerts.module';
import { AiModule } from '../../ai/ai.module';
import { SubscriptionsModule } from '../../subscriptions/subscriptions.module';
import { MatchingEngineModule } from '../../matching-engine/matching-engine.module';

@Module({
  imports: [
    PrismaModule,
    MessagesModule,
    NotificationsModule,
    JobAlertsModule,
    AiModule,
    SubscriptionsModule,
    MatchingEngineModule,
  ],
  controllers: [JobPostingsController, AdminJobPostingsController],
  providers: [JobPostingsService],
})
export class JobPostingsModule {}
