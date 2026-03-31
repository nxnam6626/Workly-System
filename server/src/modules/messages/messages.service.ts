import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true, recruiter: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const orConditions: any[] = [];
    if (user.candidate?.candidateId) {
      orConditions.push({ candidateId: user.candidate.candidateId });
    }
    if (user.recruiter?.recruiterId) {
      orConditions.push({ recruiterId: user.recruiter.recruiterId });
    }

    if (orConditions.length === 0) return [];

    return this.prisma.conversation.findMany({
      where: { OR: orConditions },
      include: {
        candidate: {
          select: {
            candidateId: true,
            fullName: true,
            user: { select: { avatar: true, userId: true } },
          },
        },
        recruiter: {
          select: {
            recruiterId: true,
            user: { select: { avatar: true, userId: true } },
            company: { select: { companyName: true } },
          },
        },
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { senderId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { sentAt: 'asc' },
    });
  }

  async createConversation(candidateId: string, recruiterId: string) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { candidateId, recruiterId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { candidateId, recruiterId, lastMessage: '', isRead: false },
      });
    }

    return conversation;
  }

  async sendMessage(senderId: string, conversationId: string, content: string) {
    const message = await this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content,
      },
    });

    await this.prisma.conversation.update({
      where: { conversationId },
      data: {
        lastMessage: content,
        updatedAt: new Date(),
        isRead: false,
      },
    });

    return message;
  }

  async broadcastMessage(recruiterUserId: string, candidateIds: string[], content: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const results: any[] = [];
    for (const candidateId of candidateIds) {
      const conv = await this.createConversation(candidateId, recruiter.recruiterId);
      const msg = await this.sendMessage(recruiterUserId, conv.conversationId, content);
      results.push(msg);
    }
    return results;
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true, recruiter: true },
    });
    if (!user) return { unreadCount: 0 };

    const orConditions: any[] = [];
    if (user.candidate?.candidateId) {
      orConditions.push({ candidateId: user.candidate.candidateId });
    }
    if (user.recruiter?.recruiterId) {
      orConditions.push({ recruiterId: user.recruiter.recruiterId });
    }

    if (orConditions.length === 0) return { unreadCount: 0 };

    const conversations = await this.prisma.conversation.findMany({
      where: { OR: orConditions, isRead: false },
      include: {
        messages: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { senderId: true }
        }
      }
    });

    const count = conversations.filter(c => c.messages.length > 0 && c.messages[0].senderId !== userId).length;
    return { unreadCount: count };
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversation.update({
      where: { conversationId },
      data: { isRead: true }
    });
    
    await this.prisma.message.updateMany({
      where: { conversationId, isRead: false },
      data: { isRead: true }
    });
    
    return { success: true };
  }
}
