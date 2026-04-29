import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGateway } from './ai.gateway';
import { AdminAiService } from './admin-ai.service';
import { AiExtractionService } from './services/ai-extraction.service';
import { AiJdService } from './services/ai-jd.service';
import { AiMatchingService } from './ai-matching.service';
import { AiModerationService } from './ai-moderation.service';
import { AiInsightsService } from './ai-insights.service';
import { AiChatService } from './ai-chat.service';
import { ChatService } from './chat.service';
import { AiChatContextService } from './services/ai-chat-context.service';
import { AiChatIntentService } from './services/ai-chat-intent.service';
import { AiChatResponseService } from './services/ai-chat-response.service';
import { RecruiterJdAnalysisService } from './services/recruiter-jd-analysis.service';
import { RecruiterAggregateService } from './services/recruiter-aggregate.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'matching',
    }),
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiGateway,
    AdminAiService,
    AiExtractionService,
    AiJdService,
    AiMatchingService,
    AiModerationService,
    AiInsightsService,
    AiChatService,
    ChatService,
    AiChatContextService,
    AiChatIntentService,
    AiChatResponseService,
    RecruiterJdAnalysisService,
    RecruiterAggregateService,
  ],
  exports: [
    AiService,
    AiChatService,
    AiChatContextService,
    AiChatIntentService,
    AiChatResponseService,
    RecruiterJdAnalysisService,
    RecruiterAggregateService,
    AiExtractionService,
    AiJdService,
  ],
})
export class AiModule { }
