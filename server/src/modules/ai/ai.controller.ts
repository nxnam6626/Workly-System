import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Sse,
  MessageEvent,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { Observable, from, map } from 'rxjs';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message) return { message: 'Hãy nhập điều gì đó!' };
    const response = await this.aiService.generateResponse(message);
    return { message: response };
  }

  @Sse('chat-stream')
  chatStream(@Query('message') message: string): Observable<MessageEvent> {
    console.log(
      `[AiController] Received stream request for message: ${message}`,
    );
    return from(this.aiService.generateStreamResponse(message)).pipe(
      map((text) => ({ data: text }) as MessageEvent),
    );
  }
}
