import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MessagesService } from './messages.service';
import { MessagesGateway } from './messages.gateway';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';

@Controller('messages')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

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

  @Get('violations/:userId')
  @Roles(Role.ADMIN)
  getUserViolations(@Param('userId') userId: string) {
    return this.messagesService.getUserViolations(userId);
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
  getMessages(
    @Req() req,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : 30;
    return this.messagesService.getMessages(req.user.userId, conversationId, parsedLimit, cursor);
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

  @Post('job-invitation')
  @Roles(Role.RECRUITER)
  sendJobInvitationMessage(
    @Req() req,
    @Body() body: { candidateId: string; jobPostingId: string },
  ) {
    return this.messagesService.sendJobInvitationMessage(
      req.user.userId,
      body.candidateId,
      body.jobPostingId,
    );
  }

  @Post('upload-attachment')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAttachment(
    @Req() req,
    @Body('conversationId') conversationId: string,
    @Body('receiverUserId') receiverUserId: string,
    @UploadedFile() file: any,
  ) {
    if (!file) throw new BadRequestException('No file provided');
    if (!conversationId) throw new BadRequestException('conversationId is required');

    const message = await this.messagesService.sendAttachment(
      req.user.userId,
      conversationId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size
    );

    // Emit to sender
    this.messagesGateway.server.to(`user_${req.user.userId}`).emit('newMessage', message);
    
    // Emit to receiver
    if (receiverUserId) {
      this.messagesGateway.server.to(`user_${receiverUserId}`).emit('newMessage', message);
    }

    return message;
  }
}
