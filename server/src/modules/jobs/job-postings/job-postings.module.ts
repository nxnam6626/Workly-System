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

import { JobCategoryService } from './services/job-category.service';
import { JobModerationService } from './services/job-moderation.service';
import { JobSearchService } from './services/job-search.service';
import { JobNotificationService } from './services/job-notification.service';
import { JobLifecycleService } from './services/job-lifecycle.service';
import { JobRecommendationService } from './services/job-recommendation.service';
import { JobAdminService } from './services/job-admin.service';

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
  providers: [
    JobPostingsService,
    JobCategoryService,
    JobModerationService,
    JobSearchService,
    JobNotificationService,
    JobLifecycleService,
    JobRecommendationService,
    JobAdminService,
  ],
  exports: [
    JobPostingsService,
    JobCategoryService,
    JobModerationService,
    JobSearchService,
    JobNotificationService,
    JobLifecycleService,
    JobRecommendationService,
    JobAdminService,
  ],
})
export class JobPostingsModule { }
