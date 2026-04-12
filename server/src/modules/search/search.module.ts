import { Global, Module } from '@nestjs/common';
import { SearchService } from './search.service';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MessagesModule,
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  providers: [SearchService, MatchingService, MatchingProcessor],
  exports: [SearchService, MatchingService, BullModule],
})
export class SearchModule {}
