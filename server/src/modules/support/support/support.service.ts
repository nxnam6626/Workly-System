import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { SupabaseService } from '@/common/supabase/supabase.service';
import { AiService } from '@/modules/intelligence/ai/ai.service';
import { WalletBalanceService } from '@/modules/billing/wallets/services/wallet-balance.service';
import { WalletPaymentService } from '@/modules/billing/wallets/services/wallet-payment.service';
import { MailService } from '@/mail/mail.service';

@Injectable()
export class SupportService {
  private readonly logger = new Logger(SupportService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
    private supabaseService: SupabaseService,
    private aiService: AiService,
    private balanceService: WalletBalanceService,
    private paymentService: WalletPaymentService,
    private mailService: MailService,
  ) {}

  async createSupportRequest(dto: CreateSupportDto, userId?: string, file?: Express.Multer.File) {
    let resolvedUserId = userId;
    let attachmentUrl: string | null = null;
    let status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED' = 'OPEN';
    let autoResolvedMessage = '';

    if (!resolvedUserId && dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
        select: { userId: true },
      });
      if (existingUser) {
        resolvedUserId = existingUser.userId;
      }
    }

    if (file) {
      try {
        const uniqueFileName = `supports/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        attachmentUrl = await this.supabaseService.uploadFile(
          file.buffer,
          uniqueFileName,
          file.mimetype,
        );

        if (dto.subject === 'Hỗ trợ nạp tiền/Khuyến mãi' || dto.subject === 'Hỗ trợ thanh toán') {
          this.logger.log(`Verifying payment receipt for user ${resolvedUserId}`);
          const aiResult = await this.aiService.verifyPaymentReceipt(file.buffer, file.mimetype);
          
          let targetOrderCode = aiResult.orderCode;

          // Decide which ID to query PayOS with
          const queryId = aiResult.transactionCode || aiResult.orderCode;

          if (aiResult.isValid && queryId) {
            this.logger.log(`Verifying ID: ${queryId} directly with PayOS...`);
            const payosStatus = await this.paymentService.verifyPaymentLink(queryId);
            
            if (payosStatus) {
              const targetOrderCode = payosStatus.orderCode;
              this.logger.log(`PayOS returned orderCode: ${targetOrderCode}, status: ${payosStatus.status}`);

              if (payosStatus.status === 'PAID' && targetOrderCode) {
                const tx = await this.prisma.transaction.findUnique({
                  where: { orderCode: targetOrderCode },
                  include: { recruiter: { select: { recruiterId: true } } }
                });

              if (tx && tx.status === 'PENDING') {
                this.logger.log(`Transaction ${tx.transactionId} is PENDING but PAID in PayOS. Resolving automatically...`);
                
                // Add money
                if (tx.recruiterId) {
                  await this.balanceService.add(tx.recruiterId, tx.amount, 'Thanh toán thành công (Xác minh tự động)');
                }
                
                // Update transaction status
                await this.prisma.transaction.update({
                  where: { transactionId: tx.transactionId },
                  data: { status: 'SUCCESS' },
                });

                status = 'CLOSED';
                autoResolvedMessage = `\n\n[Hệ thống tự động] Cảm ơn bạn, chúng tôi đã kiểm tra và giao dịch nạp xu với mã ${targetOrderCode} đã được thanh toán thành công. Số xu đã được cộng vào tài khoản nhà tuyển dụng của bạn. Yêu cầu này đã được đóng.`;
              } else if (!tx) {
                // If not found in recruiter transaction, check candidate transaction
                const ctx = await this.prisma.candidateTransaction.findUnique({
                  where: { orderCode: targetOrderCode },
                  include: { wallet: { select: { candidateId: true } } }
                });
                if (ctx && ctx.status === 'PENDING') {
                  this.logger.log(`CandidateTransaction ${ctx.transactionId} is PENDING but PAID in PayOS. Resolving automatically...`);
                  
                  // Update balance
                  await this.prisma.candidateWallet.update({
                    where: { walletId: ctx.walletId },
                    data: { balance: { increment: ctx.amount } },
                  });
                  
                  // Update transaction status
                  await this.prisma.candidateTransaction.update({
                    where: { transactionId: ctx.transactionId },
                    data: { status: 'SUCCESS' },
                  });

                  status = 'CLOSED';
                  autoResolvedMessage = `\n\n[Hệ thống tự động] Cảm ơn bạn, chúng tôi đã kiểm tra và giao dịch nạp tiền với mã ${targetOrderCode} đã được thanh toán thành công. Tiền đã được cộng vào ví ứng viên của bạn. Yêu cầu này đã được đóng.`;
                }
              }
              }
            } else {
              this.logger.log(`PayOS verification failed or status is not PAID. (Status: ${payosStatus?.status})`);
              status = 'CLOSED';
              autoResolvedMessage = `\n\n[Hệ thống tự động] Xin lỗi, hệ thống không tìm thấy giao dịch hợp lệ trên cổng thanh toán hoặc giao dịch chưa được thanh toán thành công. Yêu cầu của bạn đã bị từ chối và tự động đóng. Vui lòng kiểm tra lại.`;
            }
          }
        }
      } catch (err: any) {
        this.logger.error(`Failed to handle support attachment: ${err.message}`);
      }
    }

    const finalMessage = dto.message + autoResolvedMessage;

    const request = await this.prisma.supportRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: finalMessage,
        attachmentUrl,
        status,
        userId: resolvedUserId || null,
      },
    });

    if (status !== 'CLOSED') {
      // Notify ALL admins
      const admins = await this.prisma.user.findMany({
        where: {
          userRoles: { some: { role: { roleName: 'ADMIN' } } },
        },
      });

      for (const admin of admins) {
        const title = 'Yêu cầu hỗ trợ mới';
        const msg = `Có yêu cầu hỗ trợ mới từ ${dto.email}: "${dto.subject}"`;
        await this.notificationsService.create(
          admin.userId,
          title,
          msg,
          'info',
          '/admin/support',
        );
        this.messagesGateway.server
          .to(`user_${admin.userId}`)
          .emit('notification', {
            title,
            message: msg,
            type: 'info',
            link: '/admin/support',
          });
        this.messagesGateway.server.emit('newSupportRequest', {
          email: dto.email,
        });
      }
    } else if (resolvedUserId && autoResolvedMessage) {
      // Notify the user about auto-resolution
      await this.notificationsService.create(
        resolvedUserId,
        'Yêu cầu hỗ trợ đã được xử lý',
        autoResolvedMessage.replace('\n\n[Hệ thống tự động] ', '').trim(),
        'info',
        ''
      );
      this.messagesGateway.server
        .to(`user_${resolvedUserId}`)
        .emit('notification', {
          title: 'Yêu cầu hỗ trợ đã được xử lý',
          message: autoResolvedMessage.replace('\n\n[Hệ thống tự động] ', '').trim(),
          type: 'info',
          link: '',
        });
    }

    return request;
  }

  async replyToSupportRequest(requestId: string, message: string) {
    const request = await this.prisma.supportRequest.findUnique({
      where: { requestId },
    });

    if (!request) {
      throw new Error('Support request not found');
    }

    // Gửi email cho user
    await this.mailService.sendSupportReplyEmail(
      request.email,
      request.name || 'Người dùng',
      message
    );

    // Thông báo vào notification nếu có userId
    if (request.userId) {
      await this.notificationsService.create(
        request.userId,
        'Phản hồi từ Admin về khiếu nại của bạn',
        `Phản hồi: ${message}`,
        'info',
        ''
      );
      this.messagesGateway.server
        .to(`user_${request.userId}`)
        .emit('notification', {
          title: 'Phản hồi từ Admin về khiếu nại của bạn',
          message: `Phản hồi: ${message}`,
          type: 'info',
          link: '',
        });
    }

    // Cập nhật nội dung ticket và đổi trạng thái thành CLOSED
    const finalMessage = request.message + `\n\n--- Phản hồi từ Admin ---\n${message}`;

    const updated = await this.prisma.supportRequest.update({
      where: { requestId },
      data: {
        status: 'CLOSED',
        message: finalMessage,
      },
    });

    return updated;
  }

  async getAllRequests() {
    return this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            status: true,
            userRoles: { select: { role: true } },
            recruiter: { select: { violationCount: true } },
            accountLevel: true,
          },
        },
      },
    });
  }

  async updateStatus(
    requestId: string,
    status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
  ) {
    return this.prisma.supportRequest.update({
      where: { requestId },
      data: { status, updatedAt: new Date() },
    });
  }
}
