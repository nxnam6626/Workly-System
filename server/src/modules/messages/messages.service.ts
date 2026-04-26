import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../mail/mail.service';
import { StatusUser } from '@/generated/prisma';

import { AiService } from '../ai/ai.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

const EVASION_KEYWORDS = [
  '0[1-9][0-9]{8,9}',
  'zalo', 'za loo', 'za lờ', 'zzl', 'dzalo', 'zl', 'da lo', 'zá lồ', 'zép\\s*lào', 'giấy\\s*lô', 'da\\s*lô', 'za\\s*lô', 'z\\s*a\\s*l\\s*o', 'z\\.l', 'z\\.a\\.l\\.o',
  'facebook', 'fb', 'phây', 'phở\\s*bò', 'phờ\\s*bờ', 'f\\s*b', 'fesbuk', 'face\\s*book', 'fắc\\s*búc',
  'telegram', 'tele', 'tê\\s*lê\\s*gram', 'whatsapp', 'viber', 'wechat', 'skype', 'discord', 'messenger', 'mess ',
  'tiktok', 'tóp\\s*tóp', 'tik\\s*tok', 'tíc\\s*tóc', 'tok\\s*tok', 'ig', 'insta', 'instagram', 'ins', 'youtube', 'linkedin',
  'stk', 'số\\s*tài\\s*khoản', 'chuyển\\s*khoản', 'vietcombank', 'vcb', 'techcombank', 'mbbank', 'vpbank', 'momo', 'zalopay', 'vnpay', 'chuyển\\s*tiền',
  'drive\\.google', '1drv\\.ms', 'dropbox', 'notion\\.site', 'onedrive', 'googledrive',
  'không\\s*chín', 'không\\s*ba', 'không\\s*bảy', 'không\\s*tám', 'không\\s*năm', 'sđt', 'số\\s*điện\\s*thoại', 'gọi\\s*số',
  '@gmail', '@yahoo', '@hotmail', '@outlook'
];

const PROFANITY_KEYWORDS = [
  'đm', 'vcl', 'đéo', 'cmn', 'loz', 'cặc', 'lồn', 'đĩ', 'phò', 'điếm', 'địt', 'chó\\s*đẻ', 'ốc\\s*chó', 'óc\\s*chó', 'cđm', 'dcm', 'vkl', 'vl', 'cl', 'clgv', 'đb', 'đmm', 'đcm', 'đờ\\s*mờ', 'lìn', 'cc', 'cứt', 'cẹc', 'đjt', 'đụ', 'đù', 'vãi\\s*lồn', 'vãi\\s*cả\\s*lồn', 'vãi\\s*cức'
];

const EVASION_REGEX = new RegExp(`(${EVASION_KEYWORDS.join('|')})`, 'i');
const PROFANITY_REGEX = new RegExp(`(${PROFANITY_KEYWORDS.join('|')})`, 'i');

@Injectable()
export class MessagesService {
  constructor(
    public prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly aiService: AiService,
    private readonly supabaseService: SupabaseService,
  ) { }

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

    // Reverse because we fetch desc but want to display asc in UI
    const results = messages.reverse().map(msg => {
      // If it's a hidden violation and the current user is NOT the sender, mask it!
      if (msg.content.startsWith('[HIDDEN_VIOLATION]') && msg.senderId !== userId) {
        return {
          ...msg,
          // Hide it entirely for the receiver based on user's feedback
          content: 'Tin nhắn đã bị thu hồi hoặc bị ẩn do vi phạm quy tắc.',
          isViolation: true
        };
      }

      // If sender, or not violation, show original exactly
      if (msg.content.startsWith('[HIDDEN_VIOLATION]')) {
        return {
          ...msg,
          content: msg.content.replace('[HIDDEN_VIOLATION]', ''),
          isViolation: true
        };
      }

      return msg;
    });

    return results;
  }

  async getUserViolations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        senderId: userId,
        content: {
          startsWith: '[HIDDEN_VIOLATION]',
        },
      },
      include: {
        conversation: {
          include: {
            candidate: { select: { fullName: true } },
            recruiter: {
              include: {
                company: { select: { companyName: true } }
              }
            }
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
    // 1. Kiểm tra từ ngữ vi phạm (Lách luật thanh toán + Chửi thề)
    // RegExp đã được nâng cấp mạnh mẽ lấy từ EVASION_REGEX và PROFANITY_REGEX
    const normalizedContent = content.replace(/[\s\.\-\_]/g, '');

    const isEvasion = EVASION_REGEX.test(content) || EVASION_REGEX.test(normalizedContent);
    const isProfanity = PROFANITY_REGEX.test(content);

    let finalContent = content;
    let exceptionToThrow: any = null;

    if (isEvasion || isProfanity) {
      finalContent = '[HIDDEN_VIOLATION]' + content;

      // Tăng điểm vi phạm
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
      data: {
        senderId,
        conversationId,
        content: finalContent,
      },
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

    if (exceptionToThrow) {
      throw new BadRequestException({ ...exceptionToThrow, savedMessage: senderMessage });
    }

    return senderMessage;
  }

  async sendAttachment(
    senderId: string,
    conversationId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
  ) {
    let extractedText = '';
    let isEvasion = false;
    let exceptionToThrow: any = null;

    // 1. Moderate Image directly using Gemini Vision
    if (mimeType.startsWith('image/')) {
      const moderation = await this.aiService.moderateChatImageBuffer(fileBuffer, mimeType);
      isEvasion = moderation.isEvasion;
      extractedText = moderation.textExtracted;
    }
    // 2. Moderate Documents (PDF / DOCX)
    else if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      extractedText = await this.aiService.extractTextFromBuffer(fileBuffer, mimeType);

      const normalizedText = extractedText.replace(/[\s\.\-\_]/g, '');
      isEvasion = EVASION_REGEX.test(extractedText) || EVASION_REGEX.test(normalizedText) || PROFANITY_REGEX.test(extractedText);
    }
    // 3. Any other file type is not scanned. Just upload directly.

    // Evaluate violation
    if (isEvasion) {
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
            message: 'Tài khoản của bạn đã bị khóa vĩnh viễn vì chia sẻ tệp/liên kết vi phạm 3 lần.',
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
            message: `Nội dung tệp đính kèm vi phạm quy tắc. Bạn bị cảnh cáo ${newViolations}/3 lần!`,
            email: user.email,
          };
        }
      }

      // If violation, we don't save to supabase or DB
      throw new BadRequestException({ ...exceptionToThrow });
    }

    // 4. Safe -> Upload to Supabase 
    // create a unique path
    const fileExt = fileName.split('.').pop() || 'dat';
    const uniquePath = `chat_attachments/${senderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const fileUrl = await this.supabaseService.uploadFile(fileBuffer, uniquePath, mimeType);

    // 5. Save metadata to Message table
    const message = await this.prisma.message.create({
      data: {
        senderId,
        conversationId,
        content: `Đã gửi tệp: ${fileName}`,
        fileName,
        fileUrl,
        fileType: mimeType.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        fileSize,
      },
    });

    await this.prisma.conversation.update({
      where: { conversationId },
      data: {
        lastMessage: mimeType.startsWith('image/') ? '[Hình ảnh]' : '[Tệp đính kèm]',
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
      where: { jobPostingId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const companyName =
      recruiter.company?.companyName || 'Nhà Tuyển Dụng trên Workly';
    const link = job.slug
      ? `http://localhost:3000/jobs/${job.slug}`
      : `http://localhost:3000/jobs/${job.jobPostingId}`;

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
      console.error(
        'Failed to send auto-email in sendJobInvitationMessage:',
        err,
      );
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
