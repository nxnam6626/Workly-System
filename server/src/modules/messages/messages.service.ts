import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class MessagesService {
  constructor(
    public prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

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
            user: {
              select: {
                avatar: true,
                userId: true,
                isOnline: true,
                lastActive: true,
              },
            },
          },
        },
        recruiter: {
          select: {
            recruiterId: true,
            user: {
              select: {
                avatar: true,
                userId: true,
                isOnline: true,
                lastActive: true,
              },
            },
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

  async broadcastMessage(
    recruiterUserId: string,
    candidateIds: string[],
    content: string,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
      include: { company: true },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const companyName =
      recruiter.company?.companyName || 'Nhà Tuyển Dụng trên Workly';

    const results: any[] = [];
    for (const candidateId of candidateIds) {
      const conv = await this.createConversation(
        candidateId,
        recruiter.recruiterId,
      );
      const msg = await this.sendMessage(
        recruiterUserId,
        conv.conversationId,
        content,
      );
      results.push(msg);

      // Gửi email tự động
      try {
        const candidateDetails = await this.prisma.candidate.findUnique({
          where: { candidateId },
          include: { user: true },
        });
        if (candidateDetails && candidateDetails.user.email) {
          await this.mailService.sendJobInvitation(
            candidateDetails.user.email,
            candidateDetails.fullName,
            companyName,
            content,
          );
        }
      } catch (err) {
        console.error('Failed to send auto-email in broadcastMessage:', err);
      }
    }
    return results;
  }

  async sendJobInvitationMessage(
    recruiterUserId: string,
    candidateId: string,
    jobPostingId: string,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
      include: { company: true },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId }
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const companyName = recruiter.company?.companyName || 'Nhà Tuyển Dụng trên Workly';
    const link = job.slug ? `http://localhost:3000/jobs/${job.slug}` : `http://localhost:3000/jobs/${job.jobPostingId}`;
    
    const content = `Chào bạn, Công ty ${companyName} đang có đợt tuyển dụng vị trí ${job.title}. Qua phân tích hệ thống, chúng tôi nhận thấy hồ sơ của bạn đánh giá rất tiềm năng và phù hợp với vị trí này.
Chúng tôi muốn mời bạn ứng tuyển. Bạn có thể xem chi tiết công việc tại link sau: ${link}
Hãy nhấn vào nút Ứng tuyển ngay tại trang chi tiết để chúng tôi nhận được hồ sơ của bạn nhé!`;

    const conv = await this.createConversation(
      candidateId,
      recruiter.recruiterId,
    );
    const msg = await this.sendMessage(
      recruiterUserId,
      conv.conversationId,
      content,
    );

    // Gửi email tự động
    try {
      const candidateDetails = await this.prisma.candidate.findUnique({
        where: { candidateId },
        include: { user: true },
      });
      if (candidateDetails && candidateDetails.user.email) {
        await this.mailService.sendJobInvitation(
          candidateDetails.user.email,
          candidateDetails.fullName,
          companyName,
          content,
        );
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
          select: { senderId: true },
        },
      },
    });

    const count = conversations.filter(
      (c) => c.messages.length > 0 && c.messages[0].senderId !== userId,
    ).length;
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
}
