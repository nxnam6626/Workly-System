import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';

@Injectable()
export class CandidateWalletBalanceService {
  private readonly JOB_SEARCH_ACTIVATION_COST = 20000; // Hardcoded setting as discussed

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async getBalance(userId: string) {
    let candidate: any = await this.prisma.candidate.findUnique({
      where: { userId },
      include: { wallet: true },
    });

    if (!candidate) {
       throw new NotFoundException('Candidate account not found');
    }

    const wallet = await this.prisma.candidateWallet.upsert({
      where: { candidateId: candidate.candidateId },
      create: { candidateId: candidate.candidateId, balance: 0 },
      update: {}, // Ensure parallel calls just load existing instead of crashing
    });

    return {
      ...wallet,
      jobSearchExpiresAt: candidate.jobSearchExpiresAt,
    };
  }

  async getTransactions(userId: string, skip = 0, take = 20) {
    const walletData = await this.getBalance(userId);
    
    // CandidateWallet returns the standard schema object
    return this.prisma.candidateTransaction.findMany({
      where: { 
        walletId: walletData.walletId,
        status: 'SUCCESS'
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async activateJobSearch(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { wallet: true },
    });

    if (!candidate) throw new NotFoundException('Candidate not found');

    let wallet = await this.prisma.candidateWallet.upsert({
      where: { candidateId },
      create: { candidateId, balance: 0 },
      update: {},
    });

    if (wallet.balance < this.JOB_SEARCH_ACTIVATION_COST) {
      throw new BadRequestException(
        `Số dư không đủ. Cần ${this.JOB_SEARCH_ACTIVATION_COST.toLocaleString('vi-VN')}đ để kích hoạt. Vui lòng nạp thêm!`
      );
    }

    // Calculate expiration date logic
    // If currently already in active window, extend from current expiry. Else extend from Now.
    let newExpiry = new Date();
    const currentExpiry = candidate.jobSearchExpiresAt ? new Date(candidate.jobSearchExpiresAt) : null;
    
    if (currentExpiry && currentExpiry > new Date()) {
      newExpiry = new Date(currentExpiry.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      newExpiry = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    const [updatedWallet, transaction, updatedCandidate] = await this.prisma.$transaction([
      this.prisma.candidateWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: this.JOB_SEARCH_ACTIVATION_COST } },
      }),
      this.prisma.candidateTransaction.create({
        data: {
          amount: this.JOB_SEARCH_ACTIVATION_COST,
          type: 'ACTIVATE_JOB_SEARCH' as any,
          description: 'Kích hoạt trạng thái tìm việc (30 ngày)',
          walletId: wallet.walletId,
          candidateId,
          status: 'SUCCESS'
        },
      }),
      this.prisma.candidate.update({
        where: { candidateId },
        data: {
          isOpenToWork: true,
          jobSearchExpiresAt: newExpiry
        }
      })
    ]);

    return {
      message: 'Kích hoạt thành công',
      newExpiry,
      newBalance: updatedWallet.balance,
    };
  }

  // Used implicitly by Webhook when depositing money
  async add(
    candidateId: string,
    amount: number,
    description: string,
    orderCode?: number
  ) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { wallet: true },
    });

    if (!candidate) throw new NotFoundException('Candidate could not be retrieved');

    const wallet = await this.prisma.candidateWallet.upsert({
      where: { candidateId },
      create: { candidateId, balance: 0 },
      update: {},
    });
    
    if (!wallet) throw new NotFoundException('Candidate Wallet could not be retrieved');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.candidateWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.candidateTransaction.create({
        data: {
          amount,
          type: TransactionType.DEPOSIT,
          description,
          walletId: wallet.walletId,
          candidateId,
          orderCode,
          status: 'SUCCESS'
        },
      }),
    ]);

    return { updatedWallet, transaction };
  }
}
