import { Injectable } from '@nestjs/common';
import { ConversationService } from './services/conversation.service';
import { MessageAttachmentService } from './services/message-attachment.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly attachmentService: MessageAttachmentService,
  ) { }

  getConversations(userId: string) {
    return this.conversationService.getConversations(userId);
  }

  getDebugCounts() {
    return this.conversationService.getDebugCounts();
  }

  getMessages(userId: string, conversationId: string, limit: number = 30, cursor?: string) {
    return this.conversationService.getMessages(userId, conversationId, limit, cursor);
  }

  getUserViolations(userId: string) {
    return this.conversationService.getUserViolations(userId);
  }

  createConversation(candidateId: string, recruiterId: string) {
    return this.conversationService.createConversation(candidateId, recruiterId);
  }

  sendMessage(senderId: string, conversationId: string, content: string) {
    return this.conversationService.sendMessage(senderId, conversationId, content);
  }

  sendAttachment(
    senderId: string,
    conversationId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) {
    return this.attachmentService.sendAttachment(senderId, conversationId, fileBuffer, fileName, mimeType, fileSize);
  }

  broadcastMessage(recruiterUserId: string, candidateIds: string[], content: string) {
    return this.conversationService.broadcastMessage(recruiterUserId, candidateIds, content);
  }

  sendJobInvitationMessage(recruiterUserId: string, candidateId: string, jobPostingId: string) {
    return this.conversationService.sendJobInvitationMessage(recruiterUserId, candidateId, jobPostingId);
  }

  getUnreadCount(userId: string) {
    return this.conversationService.getUnreadCount(userId);
  }

  markAsRead(conversationId: string, userId: string) {
    return this.conversationService.markAsRead(conversationId, userId);
  }
}
