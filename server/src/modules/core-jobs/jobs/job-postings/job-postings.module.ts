import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { AdminJobPostingsController } from './admin-job-postings.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';
import { JobAlertsModule } from '@/modules/core-jobs/job-alerts/job-alerts.module';
import { AiModule } from '@/modules/intelligence/ai/ai.module';
import { SubscriptionsModule } from '@/modules/billing/subscriptions/subscriptions.module';
import { MatchingEngineModule } from '@/modules/intelligence/matching-engine/matching-engine.module';

import { JobCategoryService } from './services/job-category.service';
import { JobModerationService } from './services/job-moderation.service';
import { JobSearchService } from './services/job-search.service';
import { JobNotificationService } from './services/job-notification.service';
import { JobLifecycleService } from './services/job-lifecycle.service';
import { JobRecommendationService } from './services/job-recommendation.service';
import { JobAdminService } from './services/job-admin.service';
import { JobManagementService } from './services/job-management.service';

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
    JobManagementService,
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
    JobManagementService,
  ],
})
export class JobPostingsModule {}
