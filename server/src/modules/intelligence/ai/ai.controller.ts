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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

import { ChatService } from './chat.service';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
    private readonly adminAiService: AdminAiService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(
    @CurrentUser('userId') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body('message') message: string,
  ) {
    if (!message) return { message: 'Hãy nhập điều gì đó!' };
    
    const stream = this.aiService.generateStreamResponse(message, userId, roles, 'RECRUITER');
    let fullResponse = '';
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        fullResponse += chunk;
      } else if (typeof chunk === 'object' && chunk !== null) {
        // If it's an action, we can ignore or format it for the simple chat
        if ((chunk as any).type === 'SHOW_JOB_CARDS') {
          // just ignore for simple chat, or append something
        }
      }
    }
    
    // Remove __ACTION__ prefixes if any
    fullResponse = fullResponse.replace(/__ACTION__:.*?(\n|$)/g, '');
    
    return { message: fullResponse || 'Xin lỗi, tôi không thể xử lý yêu cầu lúc này.' };
  }

  @UseGuards(JwtAuthGuard)
  @Sse('chat-stream')
  chatStream(
    @CurrentUser('userId') userId: string,
    @CurrentUser('roles') roles: string[],
    @Query('message') message: string,
    @Query('context') contextMode?: string,
  ): Observable<MessageEvent> {
    const roleList = (roles || [])
      .map((r: any) => (typeof r === 'string' ? r : r?.roleName))
      .filter(Boolean);
    return from(
      this.aiService.generateStreamResponse(
        message,
        userId,
        roleList,
        contextMode,
      ),
    ).pipe(
      map(
        (text) =>
          ({
            data:
              typeof text === 'string'
                ? text.replace(/\n/g, '__NEWLINE__')
                : text,
          }) as MessageEvent,
      ),
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  @Post('fix-job')
  async autoFixJob(
    @CurrentUser('userId') userId: string,
    @Body('jobId') jobId: string,
    @Body('insightInstruction') insightInstruction: string,
  ) {
    if (!jobId || !insightInstruction) return { message: 'Thiếu tham số' };
    return this.aiService.autoFixJob(userId, jobId, insightInstruction);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  @Get('recruiter-insights')
  async getRecruiterInsights(
    @CurrentUser('userId') userId: string,
    @Query('force') force: string,
  ) {
    const forceRefresh = force === 'true';
    return this.aiService.generateRecruiterInsights(userId, forceRefresh);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  @Post('generate-jd')
  async generateJd(
    @CurrentUser('userId') userId: string,
    @Body('prompt') prompt: string,
  ) {
    if (!prompt) return { message: 'Vui lòng nhập yêu cầu' };
    return this.aiService.generateJdFromPrompt(userId, prompt);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('admin/analytics')
  async getAnalytics(@Body('query') query: string) {
    if (!query) return { answer: 'Vui lòng nhập câu hỏi phân tích dữ liệu.' };
    return this.adminAiService.processAnalyticsQuery(query);
  }
}
