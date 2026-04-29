import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiService } from '../../ai/ai.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
import { StatusUser } from '@prisma/client';
import { EVASION_REGEX, PROFANITY_REGEX } from '../constants/message-violation.constants';

@Injectable()
export class MessageAttachmentService {
  private readonly logger = new Logger(MessageAttachmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
    private readonly supabaseService: SupabaseService,
  ) { }

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

    if (mimeType.startsWith('image/')) {
      const moderation = await this.aiService.moderateChatImageBuffer(fileBuffer, mimeType);
      isEvasion = moderation.isEvasion;
      extractedText = moderation.textExtracted;
    } else if (
      mimeType === 'application/pdf' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      extractedText = await this.aiService.extractTextFromBuffer(fileBuffer, mimeType);
      const normalizedText = extractedText.replace(/[\s\.\-\_]/g, '');
      isEvasion = EVASION_REGEX.test(extractedText) || EVASION_REGEX.test(normalizedText) || PROFANITY_REGEX.test(extractedText);
    }

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
      throw new BadRequestException({ ...exceptionToThrow });
    }

    const fileExt = fileName.split('.').pop() || 'dat';
    const uniquePath = `chat_attachments/${senderId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const fileUrl = await this.supabaseService.uploadFile(fileBuffer, uniquePath, mimeType);

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
}
