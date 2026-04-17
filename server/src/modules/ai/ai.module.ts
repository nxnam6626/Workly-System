import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGateway } from './ai.gateway';
import { AdminAiService } from './admin-ai.service';
import { AiPdfService } from './ai-pdf.service';
import { AiMatchingService } from './ai-matching.service';
import { AiModerationService } from './ai-moderation.service';
import { AiInsightsService } from './ai-insights.service';
import { AiChatService } from './ai-chat.service';

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
    AiPdfService,
    AiMatchingService,
    AiModerationService,
    AiInsightsService,
    AiChatService,
  ],
  exports: [AiService],
})
export class AiModule {}
