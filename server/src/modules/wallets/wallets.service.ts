import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PayOS } from '@payos/node';

@Injectable()
export class WalletsService {
  private payos: PayOS;

  constructor(private readonly prisma: PrismaService) {
    this.payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID || 'dummy-client-id',
      apiKey: process.env.PAYOS_API_KEY || 'dummy-api-key',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy-checksum-key',
    });
  }

  async getBalance(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { wallet: true },
    });

    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    if (!recruiter.wallet) {
      const newWallet = await this.prisma.wallet.create({
        data: {
          recruiterId: recruiter.recruiterId,
          balance: 0,
        },
      });
      return newWallet;
    }

    return recruiter.wallet;
  }

  async getTransactions(userId: string) {
    const wallet = await this.getBalance(userId);
    return this.prisma.transaction.findMany({
      where: { walletId: wallet.walletId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPaymentLink(userId: string, targetXu: number) {
    if (targetXu < 10) throw new BadRequestException('Amount must be at least 10 xu');

    let wallet = await this.getBalance(userId);
    const amountVND = targetXu * 1000;
    const orderCode = Number(String(Date.now()).slice(-6));

    await this.prisma.transaction.create({
      data: {
        amount: targetXu,
        type: 'TOPUP',
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
      cancelUrl: 'http://localhost:3000/recruiter/wallet?status=CANCEL',
      returnUrl: 'http://localhost:3000/recruiter/wallet?status=SUCCESS',
      items: [
        { name: 'Workly Xu', quantity: targetXu, price: 1000 }
      ]
    };

    try {
      const paymentLink = await this.payos.paymentRequests.create(paymentData);
      return { checkoutUrl: (paymentLink as any).checkoutUrl };
    } catch (err) {
      console.error('PayOS create link failed:', err);
      throw new BadRequestException('Không thể tạo link thanh toán: ' + (err.message || err));
    }
  }

  async verifyWebhook(body: any) {
    try {
      const webhookData = await this.payos.webhooks.verify(body);

      const transaction = await this.prisma.transaction.findUnique({
        where: { orderCode: Number(webhookData.orderCode) },
      });

      if (!transaction || transaction.status === 'SUCCESS') return { status: 'ignored' };

      await this.prisma.$transaction([
        this.prisma.wallet.update({
          where: { walletId: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
        this.prisma.transaction.update({
          where: { transactionId: transaction.transactionId },
          data: { status: 'SUCCESS' },
        }),
      ]);

      return { status: 'success' };
    } catch (err) {
      console.error('PayOS webhook invalid:', err);
      throw new BadRequestException('Webhook signature invalid');
    }
  }

  async deduct(recruiterId: string, amount: number, description: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { recruiterId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          amount,
          type: 'PAYMENT',
          description,
          walletId: wallet.walletId,
        },
      }),
    ]);

    return { updatedWallet, transaction };
  }
}
