import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiLabService } from './ai-lab.service';
import { memoryStorage } from 'multer';

@Controller('ai-lab')
export class AiLabController {
  constructor(private readonly aiLabService: AiLabService) {}

  @Post('test')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async testModel(
    @Body() body: { model: string; prompt: string; apiKey?: string },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.aiLabService.processLabTest({
      model: body.model,
      prompt: body.prompt,
      file: file,
      apiKey: body.apiKey,
    });
  }
}
