import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PayOS } from '@payos/node';
import { TransactionType } from '@prisma/client';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { CandidateWalletBalanceService } from './candidate-wallet-balance.service';

@Injectable()
export class CandidateWalletPaymentService {
  private payos: PayOS;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
    private readonly balanceService: CandidateWalletBalanceService,
  ) {
    this.payos = new PayOS({
      clientId: process.env.PAYOS_CLIENT_ID || 'dummy-client-id',
      apiKey: process.env.PAYOS_API_KEY || 'dummy-api-key',
      checksumKey: process.env.PAYOS_CHECKSUM_KEY || 'dummy-checksum-key',
    });
  }

  async createPaymentLink(userId: string, amountVND: number) {
    if (amountVND < 10000)
      throw new BadRequestException('Số tiền tối thiểu để nạp là 10,000 VNĐ');

    const wallet = await this.balanceService.getBalance(userId);

    // Ensure it is candidate
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate)
      throw new BadRequestException('Tài khoản ứng viên không tồn tại');

    const orderCode =
      Number(String(Date.now()).slice(-6)) + Math.floor(Math.random() * 1000); // Add entropy

    const tx = await this.prisma.candidateTransaction.create({
      data: {
        amount: amountVND,
        realMoney: amountVND,
        type: TransactionType.DEPOSIT,
        description: `Nạp tiền vào Ví ứng viên`,
        walletId: wallet.walletId,
        candidateId: candidate.candidateId,
        status: 'PENDING',
        orderCode,
      },
    });

    const paymentData = {
      orderCode,
      amount: amountVND,
      description: `Nap vi Workly Candidate`,
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?payment=CANCEL`,
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile?payment=SUCCESS`,
      items: [
        { name: 'Nap vi Workly Candidate', quantity: 1, price: amountVND },
      ],
    };

    try {
      const paymentLink = await this.payos.paymentRequests.create(paymentData);
      const checkoutUrl = (paymentLink as { checkoutUrl: string }).checkoutUrl;

      await this.prisma.candidateTransaction.update({
        where: { transactionId: tx.transactionId },
        data: { description: `Nạp tiền ví|${checkoutUrl}` },
      });

      return { checkoutUrl };
    } catch (error) {
      console.error('PayOS Create Err:', error);
      await this.prisma.candidateTransaction.update({
        where: { transactionId: tx.transactionId },
        data: { status: 'CANCELLED' },
      });
      throw new BadRequestException(
        'Không thể tạo link thanh toán (PayOS error).',
      );
    }
  }

  async verifyWebhook(body: any) {
    try {
      const webhookData = await this.payos.webhooks.verify(body);

      // Try finding Candidate Transaction
      const transaction = await this.prisma.candidateTransaction.findUnique({
        where: { orderCode: Number(webhookData.orderCode) },
        include: {
          wallet: {
            include: {
              candidate: { select: { userId: true } },
            },
          },
        },
      });

      if (!transaction || transaction.status === 'SUCCESS') {
        // Could be a recruiter transaction handled elsewhere or duplicate webhook.
        return { status: 'ignored' };
      }

      const [updatedWallet] = await this.prisma.$transaction([
        this.prisma.candidateWallet.update({
          where: { walletId: transaction.walletId },
          data: { balance: { increment: transaction.amount } },
        }),
        this.prisma.candidateTransaction.update({
          where: { transactionId: transaction.transactionId },
          data: { status: 'SUCCESS' },
        }),
      ]);

      const userId = (transaction.wallet as any)?.candidate?.userId;

      if (userId) {
        this.messagesGateway.server
          .to(`user_${userId}`)
          .emit('candidate_wallet_updated', {
            newBalance: (updatedWallet as { balance: number }).balance,
            transactionId: transaction.transactionId,
            amount: transaction.amount,
          });
      }

      return { status: 'success' };
    } catch {
      // Fail-safe for multi-handler routing
      return { status: 'ignored_invalid_sig' };
    }
  }
}
