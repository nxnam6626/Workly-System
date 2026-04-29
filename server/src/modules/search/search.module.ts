import { Global, Module, forwardRef } from '@nestjs/common';
import { SearchService } from './search.service';
import { MatchingProcessor } from './matching.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';
import { RecruitersModule } from '../recruiters/recruiters.module';
import { MatchingEngineModule } from '../matching-engine/matching-engine.module';
import { Client } from '@elastic/elasticsearch';
import { JobEsService } from './services/job-es.service';
import { UserEsService } from './services/user-es.service';

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
  providers: [
    SearchService,
    MatchingProcessor,
    JobEsService,
    UserEsService,
    {
      provide: Client,
      useFactory: () => {
        return new Client({
          node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
          maxRetries: 0,
        });
      },
    },
  ],
  exports: [SearchService, JobEsService, UserEsService, BullModule],
})
export class SearchModule {}
