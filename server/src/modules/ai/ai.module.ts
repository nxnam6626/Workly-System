import { Module, Global } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGateway } from './ai.gateway';
import { AdminAiService } from './admin-ai.service';
import { ChatService } from './chat.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [AiService, AiGateway, AdminAiService, ChatService],
  exports: [AiService, ChatService],
})
export class AiModule {}
