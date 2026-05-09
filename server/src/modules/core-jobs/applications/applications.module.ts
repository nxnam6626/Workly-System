import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsNotificationService } from './services/applications-notification.service';
import { ApplicationStatusService } from './services/application-status.service';
import { ApplicationInterviewService } from './services/application-interview.service';
import { ApplicationStatsService } from './services/application-stats.service';
import { SlaCleanupService } from './services/sla-cleanup.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';
import { WalletsModule } from '@/modules/billing/wallets/wallets.module';
import { AiModule } from '@/modules/intelligence/ai/ai.module';
import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    MessagesModule,
    NotificationsModule,
    WalletsModule,
    AiModule,
    MailModule,
  ],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsNotificationService,
    ApplicationStatusService,
    ApplicationInterviewService,
    ApplicationStatsService,
    SlaCleanupService,
  ],
  exports: [
    ApplicationsService,
    ApplicationStatusService,
    ApplicationInterviewService,
    ApplicationStatsService,
  ],
})
export class ApplicationsModule {}
