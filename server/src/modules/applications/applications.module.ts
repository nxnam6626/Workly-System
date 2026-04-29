import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { ApplicationsNotificationService } from './services/applications-notification.service';
import { ApplicationStatusService } from './services/application-status.service';
import { ApplicationInterviewService } from './services/application-interview.service';
import { ApplicationStatsService } from './services/application-stats.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    PrismaModule,
    MessagesModule,
    NotificationsModule,
    WalletsModule,
    AiModule
  ],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    ApplicationsNotificationService,
    ApplicationStatusService,
    ApplicationInterviewService,
    ApplicationStatsService,
  ],
  exports: [
    ApplicationsService,
    ApplicationStatusService,
    ApplicationInterviewService,
    ApplicationStatsService,
  ],
})
export class ApplicationsModule { }
