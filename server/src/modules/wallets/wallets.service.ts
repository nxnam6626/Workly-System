import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayOS } from '@payos/node';
import { TransactionType } from '@prisma/client';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class WalletsService {
  private payos: PayOS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway
  ) {
    this.payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID || 'dummy-client-id',
      apiKey: process.env.PAYOS_API_KEY || 'dummy-api-key',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy-checksum-key',
    });
  }

  async getBalance(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterWallet: true },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    if (!recruiter.recruiterWallet) {
      const newWallet = await this.prisma.recruiterWallet.create({
        data: {
          recruiterId: recruiter.recruiterId,
          balance: 0,
        },
      });
      return newWallet;
    }

    return recruiter.recruiterWallet;
  }

  async getTransactions(userId: string) {
    const wallet = await this.getBalance(userId);
    const transactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.walletId },
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    const updated = await Promise.all(transactions.map(async (tx) => {
      if (tx.status === 'PENDING') {
        const diffMins = (now - tx.createdAt.getTime()) / 1000 / 60;
        if (diffMins > 5) {
          await this.prisma.transaction.update({
            where: { transactionId: tx.transactionId },
            data: { status: 'CANCELLED' },
          });
          return { ...tx, status: 'CANCELLED' };
        }
      }
      return tx;
    }));

    return updated;
  }

  async createPaymentLink(userId: string, targetXu: number) {
    if (targetXu < 10)
      throw new BadRequestException('Amount must be at least 10 xu');

    let wallet = await this.getBalance(userId);
    const amountVND = targetXu * 1000;
    const orderCode = Number(String(Date.now()).slice(-6));

    const tx = await this.prisma.transaction.create({
      data: {
        amount: targetXu,
        realMoney: amountVND,
        type: TransactionType.DEPOSIT,
        description: `Nạp ${targetXu} xu`,
        walletId: wallet.walletId,
        status: 'PENDING',
        orderCode,
      },
    });

    const paymentData = {
      orderCode,
      amount: amountVND,
      description: `Nap ${targetXu} xu vao vi`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruiter/wallet?status=CANCEL`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruiter/wallet?status=SUCCESS`,
      items: [{ name: 'Workly Xu', quantity: targetXu, price: 1000 }],
    };

    try {
      const paymentLink = await this.payos.paymentRequests.create(paymentData);
      const checkoutUrl = (paymentLink as any).checkoutUrl;
      
      // Save link for resuming later
      await this.prisma.transaction.update({
        where: { transactionId: tx.transactionId },
        data: { description: `Nạp ${targetXu} xu|${checkoutUrl}` }
      });
      
      return { checkoutUrl };
    } catch (err) {
      console.error('PayOS create link failed:', err);
      // Mark as cancelled immediately if failed
      await this.prisma.transaction.update({
        where: { transactionId: tx.transactionId },
        data: { status: 'CANCELLED' }
      });
      throw new BadRequestException(
        'Không thể tạo link thanh toán: ' + (err.message || err),
      );
    }
  }

  async resumePaymentLink(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { transactionId } });
    if (!tx || tx.type !== 'DEPOSIT') {
      throw new BadRequestException('Giao dịch không hợp lệ');
    }
    if (tx.status !== 'PENDING') {
      throw new BadRequestException('Giao dịch đã được xử lý hoặc bị huỷ');
    }

    const now = Date.now();
    const diffMins = (now - tx.createdAt.getTime()) / 1000 / 60;
    if (diffMins > 5) {
      await this.prisma.transaction.update({
        where: { transactionId },
        data: { status: 'CANCELLED' }
      });
      throw new BadRequestException('Giao dịch đã quá 5 phút, không thể tiếp tục');
    }

    const orderCode = Number(String(Date.now()).slice(-6));
    const amountVND = tx.amount * 1000;

    const paymentData = {
      orderCode,
      amount: amountVND,
      description: `Nap ${tx.amount} xu vao vi`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruiter/wallet?status=CANCEL`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recruiter/wallet?status=SUCCESS`,
      items: [{ name: 'Workly Xu', quantity: tx.amount, price: 1000 }],
    };

    try {
      const paymentLink = await this.payos.paymentRequests.create(paymentData);
      const checkoutUrl = (paymentLink as any).checkoutUrl;
      
      await this.prisma.transaction.update({
        where: { transactionId },
        data: { 
           orderCode,
           description: `Nạp ${tx.amount} xu|${checkoutUrl}`
        }
      });
      
      return { checkoutUrl };
    } catch (err) {
      console.error('PayOS resume link failed:', err);
      throw new BadRequestException('Không thể tạo lại link thanh toán');
    }
  }

  async verifyWebhook(body: any) {
    try {
      const webhookData = await this.payos.webhooks.verify(body);

      const transaction = await this.prisma.transaction.findUnique({
        where: { orderCode: Number(webhookData.orderCode) },
        include: {
          wallet: {
            include: { recruiter: { include: { user: true } } }
          }
        }
      });

      if (!transaction || transaction.status === 'SUCCESS')
        return { status: 'ignored' };

      const [updatedWallet] = await this.prisma.$transaction([
        this.prisma.recruiterWallet.update({
          where: { walletId: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
        this.prisma.transaction.update({
          where: { transactionId: transaction.transactionId },
          data: { status: 'SUCCESS' },
        }),
      ]);

      // Emit realtime notification đến recruiter (web + mobile)
      const userId = (transaction as any).wallet?.recruiter?.user?.userId;
      if (userId) {
        const newBalance = (updatedWallet as any).balance;
        this.messagesGateway.server.to(`user_${userId}`).emit('wallet_updated', {
          newBalance,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
        });
      }

      return { status: 'success' };
    } catch (err) {
      console.error('PayOS webhook invalid:', err);
      throw new BadRequestException('Webhook signature invalid');
    }
  }

  async deduct(recruiterId: string, amount: number, description: string, type: TransactionType = TransactionType.OPEN_CV) {
    const wallet = await this.prisma.recruiterWallet.findUnique({
      where: { recruiterId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.recruiterWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          amount,
          type: type,
          description,
          walletId: wallet.walletId,
        },
      }),
    ]);

    // Emit event for real-time admin revenue tracking
    this.messagesGateway.server.emit('revenueUpdated');

    return { updatedWallet, transaction };
  }

  async add(recruiterId: string, amount: number, description: string, type: TransactionType = TransactionType.DEPOSIT) {
    const wallet = await this.prisma.recruiterWallet.findUnique({
      where: { recruiterId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.recruiterWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          amount,
          type,
          description,
          walletId: wallet.walletId,
        },
      }),
    ]);

    // Emit event for real-time admin revenue tracking
    this.messagesGateway.server.emit('revenueUpdated');

    return { updatedWallet, transaction };
  }

  async addCvQuota(recruiterId: string, quotaAmount: number, description: string) {
    const wallet = await this.prisma.recruiterWallet.findUnique({
      where: { recruiterId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.recruiterWallet.update({
        where: { walletId: wallet.walletId },
        data: {
          cvUnlockQuota: { increment: quotaAmount },
          cvUnlockQuotaMax: { increment: quotaAmount },
        },
      }),
      this.prisma.transaction.create({
        data: {
          amount: 0,
          type: TransactionType.BUY_PACKAGE,
          description,
          walletId: wallet.walletId,
        },
      }),
    ]);

    return { updatedWallet, transaction };
  }

  async deductCvUnlock(recruiterId: string, description: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { recruiterWallet: true, recruiterSubscription: true },
    });

    if (!recruiter || !recruiter.recruiterWallet) {
      throw new NotFoundException('Wallet not found');
    }

    const { recruiterWallet: wallet, recruiterSubscription: sub } = recruiter;

    // 1. Ưu tiên trừ hạn mức Quota CV
    if (wallet.cvUnlockQuota > 0) {
      const [updatedWallet, transaction] = await this.prisma.$transaction([
        this.prisma.recruiterWallet.update({
          where: { walletId: wallet.walletId },
          data: { cvUnlockQuota: { decrement: 1 } },
        }),
        this.prisma.transaction.create({
          data: {
            amount: 0,
            type: TransactionType.OPEN_CV,
            description: `${description} (Miễn phí từ Gói CV Hunter)`,
            walletId: wallet.walletId,
          },
        }),
      ]);
      return { updatedWallet, transaction, usedQuota: true, cost: 0 };
    }

    // 2. Không có Quota CV -> Kiểm tra gói tháng -> Tính giá mở lẻ
    const hasActiveSub = sub && (new Date() > sub.expiryDate === false);
    const cost = hasActiveSub ? 30 : 50;

    if (wallet.balance < cost) {
      throw new BadRequestException(`Cần ${cost} Xu để mở khóa liên hệ (Bạn không còn lượt mở miễn phí). Vui lòng nạp thêm Xu!`);
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.recruiterWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: cost } },
      }),
      this.prisma.transaction.create({
        data: {
          amount: cost,
          type: TransactionType.OPEN_CV,
          description: `${description} (Phí sỉ ${cost} xu)`,
          walletId: wallet.walletId,
        },
      }),
    ]);

    return { updatedWallet, transaction, usedQuota: false, cost };
  }
}
