import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('debug')
  async debugCounts() {
    const msgs = await this.messagesService.prisma.message.findMany();
    const counts: Record<string, number> = {};
    msgs.forEach((m) => {
      counts[m.content] = (counts[m.content] || 0) + 1;
    });
    return {
      totalMessages: msgs.length,
      duplicates: Object.entries(counts)
        .filter(([k, v]) => v > 1)
        .map(([k, v]) => ({ [k]: v })),
    };
  }

  @Get('conversations')
  getConversations(@Req() req) {
    return this.messagesService.getConversations(req.user.userId);
  }

  @Get('unread-count')
  getUnreadCount(@Req() req) {
    return this.messagesService.getUnreadCount(req.user.userId);
  }

  @Patch('conversations/:id/read')
  markAsRead(@Req() req, @Param('id') conversationId: string) {
    return this.messagesService.markAsRead(conversationId, req.user.userId);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') conversationId: string) {
    return this.messagesService.getMessages(conversationId);
  }

  @Post('broadcast')
  @Roles(Role.RECRUITER)
  broadcastMessage(
    @Req() req,
    @Body() body: { candidateIds: string[]; content: string },
  ) {
    return this.messagesService.broadcastMessage(
      req.user.userId,
      body.candidateIds,
      body.content,
    );
  }
}
