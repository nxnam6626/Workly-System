import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MailService } from '../../../mail/mail.service';
import { StatusUser } from '@prisma/client';
import { EVASION_REGEX, PROFANITY_REGEX } from '../constants/message-violation.constants';

@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) { }

  async getConversations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true, recruiter: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const orConditions: any[] = [];
    if (user.candidate?.candidateId) orConditions.push({ candidateId: user.candidate.candidateId });
    if (user.recruiter?.recruiterId) orConditions.push({ recruiterId: user.recruiter.recruiterId });

    if (orConditions.length === 0) return [];

    return this.prisma.conversation.findMany({
      where: { OR: orConditions },
      include: {
        candidate: {
          select: {
            candidateId: true,
            fullName: true,
            user: { select: { avatar: true, userId: true, isOnline: true, lastActive: true } },
          },
        },
        recruiter: {
          select: {
            recruiterId: true,
            user: { select: { avatar: true, userId: true, isOnline: true, lastActive: true } },
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

  async getMessages(userId: string, conversationId: string, limit: number = 30, cursor?: string) {
    const query: any = {
      where: { conversationId },
      orderBy: { sentAt: 'desc' },
      take: limit,
    };

    if (cursor) {
      query.cursor = { messageId: cursor };
      query.skip = 1;
    }

    const messages = await this.prisma.message.findMany(query);

    return messages.reverse().map(msg => {
      if (msg.content.startsWith('[HIDDEN_VIOLATION]') && msg.senderId !== userId) {
        return {
          ...msg,
          content: 'Tin nhắn đã bị thu hồi hoặc bị ẩn do vi phạm quy tắc.',
          isViolation: true
        };
      }
      if (msg.content.startsWith('[HIDDEN_VIOLATION]')) {
        return {
          ...msg,
          content: msg.content.replace('[HIDDEN_VIOLATION]', ''),
          isViolation: true
        };
      }
      return msg;
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
    const normalizedContent = content.replace(/[\s\.\-\_]/g, '');
    const isEvasion = EVASION_REGEX.test(content) || EVASION_REGEX.test(normalizedContent);
    const isProfanity = PROFANITY_REGEX.test(content);

    let finalContent = content;
    let exceptionToThrow: any = null;

    if (isEvasion || isProfanity) {
      finalContent = '[HIDDEN_VIOLATION]' + content;
      const user = await this.prisma.user.findUnique({ where: { userId: senderId } });
      if (user) {
        const newViolations = user.violations + 1;
        if (newViolations >= 3) {
          await this.prisma.user.update({
            where: { userId: senderId },
            data: { violations: newViolations, status: StatusUser.LOCKED },
          });
          await this.prisma.recruiter.updateMany({
            where: { userId: senderId },
            data: { violationCount: newViolations }
          });
          exceptionToThrow = {
            error: 'ACCOUNT_LOCKED',
            message: 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy tắc cộng đồng 3 lần.',
            email: user.email,
          };
        } else {
          await this.prisma.user.update({
            where: { userId: senderId },
            data: { violations: newViolations },
          });
          await this.prisma.recruiter.updateMany({
            where: { userId: senderId },
            data: { violationCount: newViolations }
          });
          exceptionToThrow = {
            error: 'VIOLATION',
            message: `Hệ thống phát hiện thông tin liên lạc trái phép hoặc ngôn từ không phù hợp. Bạn đã vi phạm ${newViolations}/3 lần. Tài khoản sẽ bị khóa nếu vi phạm 3 lần!`,
            email: user.email,
          };
        }
      }
    }

    const message = await this.prisma.message.create({
      data: { senderId, conversationId, content: finalContent },
    });

    await this.prisma.conversation.update({
      where: { conversationId },
      data: {
        lastMessage: finalContent.startsWith('[HIDDEN_VIOLATION]') ? 'Tin nhắn đã bị ẩn do vi phạm quy tắc hệ thống.' : finalContent,
        updatedAt: new Date(),
        isRead: false,
      },
    });

    const senderMessage = { ...message, content, isViolated: finalContent.startsWith('[HIDDEN_VIOLATION]') };
    if (exceptionToThrow) throw new BadRequestException({ ...exceptionToThrow, savedMessage: senderMessage });

    return senderMessage;
  }

  async broadcastMessage(recruiterUserId: string, candidateIds: string[], content: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
      include: { company: true },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const companyName = recruiter.company?.companyName || 'Nhà Tuyển Dụng trên Workly';
    const results: any[] = [];
    for (const candidateId of candidateIds) {
      const conv = await this.createConversation(candidateId, recruiter.recruiterId);
      const msg = await this.sendMessage(recruiterUserId, conv.conversationId, content);
      results.push(msg);

      try {
        const candidateDetails = await this.prisma.candidate.findUnique({
          where: { candidateId },
          include: { user: true },
        });
        if (candidateDetails?.user.email) {
          await this.mailService.sendJobInvitation(candidateDetails.user.email, candidateDetails.fullName, companyName, content);
        }
      } catch (err) {
        console.error('Failed to send auto-email in broadcastMessage:', err);
      }
    }
    return results;
  }

  async getUserViolations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        senderId: userId,
        content: { startsWith: '[HIDDEN_VIOLATION]' },
      },
      include: {
        conversation: {
          include: {
            candidate: { select: { fullName: true } },
            recruiter: { include: { company: { select: { companyName: true } } } }
          }
        }
      },
      orderBy: { sentAt: 'desc' },
    });

    return messages.map(m => ({
      messageId: m.messageId,
      content: m.content.replace('[HIDDEN_VIOLATION]', ''),
      sentAt: m.sentAt,
      conversationName: m.conversation?.candidate?.fullName || m.conversation?.recruiter?.company?.companyName || 'Không rõ',
    }));
  }

  async sendJobInvitationMessage(recruiterUserId: string, candidateId: string, jobPostingId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
      include: { company: true },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const job = await this.prisma.jobPosting.findUnique({ where: { jobPostingId } });
    if (!job) throw new NotFoundException('Job not found');

    const companyName = recruiter.company?.companyName || 'Nhà Tuyển Dụng trên Workly';
    const link = job.slug ? `http://localhost:3000/jobs/${job.slug}` : `http://localhost:3000/jobs/${job.jobPostingId}`;
    const content = `Chào bạn, Công ty ${companyName} đang có đợt tuyển dụng vị trí ${job.title}. Qua phân tích hệ thống, chúng tôi nhận thấy hồ sơ của bạn đánh giá rất tiềm năng và phù hợp với vị trí này.\nChúng tôi muốn mời bạn ứng tuyển. Bạn có thể xem chi tiết công việc tại link sau: ${link}\nHãy nhấn vào nút Ứng tuyển ngay tại trang chi tiết để chúng tôi nhận được hồ sơ của bạn nhé!`;

    const conv = await this.createConversation(candidateId, recruiter.recruiterId);
    const msg = await this.sendMessage(recruiterUserId, conv.conversationId, content);

    try {
      const candidateDetails = await this.prisma.candidate.findUnique({
        where: { candidateId },
        include: { user: true },
      });
      if (candidateDetails?.user.email) {
        await this.mailService.sendJobInvitation(candidateDetails.user.email, candidateDetails.fullName, companyName, content);
      }
    } catch (err) {
      console.error('Failed to send auto-email in sendJobInvitationMessage:', err);
    }

    return msg;
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true, recruiter: true },
    });
    if (!user) return { unreadCount: 0 };

    const orConditions: any[] = [];
    if (user.candidate?.candidateId) orConditions.push({ candidateId: user.candidate.candidateId });
    if (user.recruiter?.recruiterId) orConditions.push({ recruiterId: user.recruiter.recruiterId });

    if (orConditions.length === 0) return { unreadCount: 0 };

    const conversations = await this.prisma.conversation.findMany({
      where: { OR: orConditions, isRead: false },
      include: {
        messages: { orderBy: { sentAt: 'desc' }, take: 1, select: { senderId: true } },
      },
    });

    const count = conversations.filter(c => c.messages.length > 0 && c.messages[0].senderId !== userId).length;
    return { unreadCount: count };
  }

  async markAsRead(conversationId: string, userId: string) {
    await this.prisma.conversation.update({
      where: { conversationId },
      data: { isRead: true },
    });
    await this.prisma.message.updateMany({
      where: { conversationId, isRead: false },
      data: { isRead: true },
    });
    return { success: true };
  }

  async getDebugCounts() {
    const msgs = await this.prisma.message.findMany();
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
}
