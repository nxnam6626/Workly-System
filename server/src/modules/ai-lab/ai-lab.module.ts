import { Module } from '@nestjs/common';
import { AiLabController } from './ai-lab.controller';
import { AiLabService } from './ai-lab.service';

@Module({
  controllers: [AiLabController],
  providers: [AiLabService],
  exports: [AiLabService],
})
export class AiLabModule {}
