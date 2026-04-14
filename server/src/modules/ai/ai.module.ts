import { Module, Global } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGateway } from './ai.gateway';
import { AdminAiService } from './admin-ai.service';

@Global()
@Module({
  controllers: [AiController],
  providers: [AiService, AiGateway, AdminAiService],
  exports: [AiService],
})
export class AiModule {}
