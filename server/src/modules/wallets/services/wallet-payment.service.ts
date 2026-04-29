import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PayOS } from '@payos/node';
import { TransactionType } from '@prisma/client';
import { MessagesGateway } from '../../messages/messages.gateway';
import { WalletBalanceService } from './wallet-balance.service';

@Injectable()
export class WalletPaymentService {
  private payos: PayOS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
    private readonly balanceService: WalletBalanceService,
  ) {
    this.payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID || 'dummy-client-id',
      apiKey: process.env.PAYOS_API_KEY || 'dummy-api-key',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy-checksum-key',
    });
  }

  async createPaymentLink(userId: string, targetXu: number) {
    if (targetXu < 10) throw new BadRequestException('Amount must be at least 10 xu');

    const wallet = await this.balanceService.getBalance(userId);
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

      await this.prisma.transaction.update({
        where: { transactionId: tx.transactionId },
        data: { description: `Nạp ${targetXu} xu|${checkoutUrl}` },
      });

      return { checkoutUrl };
    } catch (err) {
      await this.prisma.transaction.update({
        where: { transactionId: tx.transactionId },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException('Không thể tạo link thanh toán: ' + (err.message || err));
    }
  }

  async resumePaymentLink(userId: string, transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({ where: { transactionId } });
    if (!tx || tx.type !== 'DEPOSIT' || tx.status !== 'PENDING') {
      throw new BadRequestException('Giao dịch không hợp lệ hoặc đã hết hạn');
    }

    const diffMins = (Date.now() - tx.createdAt.getTime()) / 1000 / 60;
    if (diffMins > 5) {
      await this.prisma.transaction.update({ where: { transactionId }, data: { status: 'CANCELLED' } });
      throw new BadRequestException('Giao dịch đã quá 5 phút');
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
        data: { orderCode, description: `Nạp ${tx.amount} xu|${checkoutUrl}` },
      });

      return { checkoutUrl };
    } catch (err) {
      throw new BadRequestException('Không thể tạo lại link thanh toán');
    }
  }

  async verifyWebhook(body: any) {
    try {
      const webhookData = await this.payos.webhooks.verify(body);
      const transaction = await this.prisma.transaction.findUnique({
        where: { orderCode: Number(webhookData.orderCode) },
        include: { wallet: { include: { recruiter: { include: { user: true } } } } },
      });

      if (!transaction || transaction.status === 'SUCCESS') return { status: 'ignored' };

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

      const userId = (transaction as any).wallet?.recruiter?.user?.userId;
      if (userId) {
        this.messagesGateway.server.to(`user_${userId}`).emit('wallet_updated', {
          newBalance: (updatedWallet as any).balance,
          transactionId: transaction.transactionId,
          amount: transaction.amount,
        });
      }

      return { status: 'success' };
    } catch (err) {
      throw new BadRequestException('Webhook signature invalid');
    }
  }
}
