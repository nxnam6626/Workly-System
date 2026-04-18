import { Global, Module, forwardRef } from '@nestjs/common';
import { SearchService } from './search.service';
import { MatchingService } from './matching.service';
import { MatchingProcessor } from './matching.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { RecruitersModule } from '../recruiters/recruiters.module';
import { MatchingEngineModule } from '../matching-engine/matching-engine.module';

@Global()
@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MessagesModule,
    MatchingEngineModule,
    forwardRef(() => RecruitersModule),
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  providers: [SearchService, MatchingService, MatchingProcessor],
  exports: [SearchService, MatchingService, BullModule],
})
export class SearchModule {}
