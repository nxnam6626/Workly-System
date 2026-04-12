import { Module, Global } from '@nestjs/common';
import { AiService } from './ai.service';

@Global()
@Module({
import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
