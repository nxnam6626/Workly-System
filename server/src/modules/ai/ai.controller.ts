import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Sse,
  MessageEvent,
  UseGuards,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { AdminAiService } from './admin-ai.service';
import { Observable, from, map } from 'rxjs';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { ChatService } from './chat.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
    private readonly adminAiService: AdminAiService,
  ) { }

  @Post('chat')
  async chat(@Body('message') message: string) {
    if (!message) return { message: 'Hãy nhập điều gì đó!' };
    const response = await this.aiService.generateResponse(message);
    return { message: response };
  }

  @UseGuards(JwtAuthGuard)
  @Sse('chat-stream')
  chatStream(
    @CurrentUser('userId') userId: string,
    @Query('message') message: string,
  ): Observable<MessageEvent> {
    console.log(
      `[AiController] Received stream request from user ${userId} for message: ${message}`,
    );
    return from(this.chatService.generateStreamResponse(message, userId)).pipe(
      map((text) => ({ data: text }) as MessageEvent),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  @Get('recruiter-insights')
  async getRecruiterInsights(@CurrentUser('userId') userId: string) {
    return this.aiService.generateRecruiterInsights(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/analytics')
  async getAnalytics(@Body('query') query: string) {
    if (!query) return { answer: 'Vui lòng nhập câu hỏi phân tích dữ liệu.' };
    return this.adminAiService.processAnalyticsQuery(query);
  }
}
