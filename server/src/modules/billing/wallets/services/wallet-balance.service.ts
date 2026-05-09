import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { TransactionType } from '@prisma/client';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';

@Injectable()
export class WalletBalanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
  ) {}

  async getBalance(userId: string) {
    let recruiter: any = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { company: { include: { wallet: true } }, recruiterSubscription: true },
    });

    if (!recruiter) {
      recruiter = await this.prisma.recruiter.create({
        data: { userId },
        include: { company: { include: { wallet: true } }, recruiterSubscription: true },
      }) as any;
    }

    if (!recruiter.companyId) {
      throw new BadRequestException('Tài khoản này chưa thuộc công ty nào nên không có Ví');
    }

    if (!recruiter.company?.wallet) {
      const wallet = await this.prisma.companyWallet.create({
        data: { companyId: recruiter.companyId, balance: 0 },
      });
      return { ...wallet, subscription: recruiter.recruiterSubscription };
    }

    return {
      ...recruiter.company.wallet,
      subscription: recruiter.recruiterSubscription,
    };
  }

  async getTransactions(userId: string, skip = 0, take = 20) {
    const wallet = await this.getBalance(userId);

    const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
    await this.prisma.transaction.updateMany({
      where: {
        walletId: wallet.walletId,
        status: 'PENDING',
        createdAt: { lt: fiveMinsAgo },
      },
      data: { status: 'CANCELLED' },
    });

    return this.prisma.transaction.findMany({
      where: { walletId: wallet.walletId },
      include: { recruiter: { select: { fullName: true, user: { select: { email: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async deduct(
    recruiterId: string,
    amount: number,
    description: string,
    type: TransactionType = TransactionType.OPEN_CV,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { company: { include: { wallet: true } } },
    });
    const wallet = recruiter?.company?.wallet;
    
    if (!wallet) throw new NotFoundException('Company Wallet not found');
    if (wallet.balance < amount)
      throw new BadRequestException('Insufficient balance in Company Wallet');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.companyWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.transaction.create({
        data: { amount, type, description, walletId: wallet.walletId, recruiterId },
      }),
    ]);

    this.messagesGateway.server.emit('revenueUpdated');
    return { updatedWallet, transaction };
  }

  async add(
    recruiterId: string,
    amount: number,
    description: string,
    type: TransactionType = TransactionType.DEPOSIT,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { company: { include: { wallet: true } } },
    });
    const wallet = recruiter?.company?.wallet;
    
    if (!wallet) throw new NotFoundException('Company Wallet not found');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.companyWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: { amount, type, description, walletId: wallet.walletId, recruiterId },
      }),
    ]);

    this.messagesGateway.server.emit('revenueUpdated');
    return { updatedWallet, transaction };
  }

  async refund(recruiterId: string, amount: number, description: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { company: { include: { wallet: true } } },
    });
    const wallet = recruiter?.company?.wallet;
    
    if (!wallet) throw new NotFoundException('Company Wallet not found');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.companyWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: amount } },
      }),
      this.prisma.transaction.create({
        data: {
          amount,
          type: TransactionType.DEPOSIT,
          description,
          walletId: wallet.walletId,
          recruiterId,
        },
      }),
    ]);

    this.messagesGateway.server.emit('revenueUpdated');
    return { updatedWallet, transaction };
  }

  async addCvQuota(
    recruiterId: string,
    quotaAmount: number,
    description: string,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { company: { include: { wallet: true } } },
    });
    const wallet = recruiter?.company?.wallet;
    
    if (!wallet) throw new NotFoundException('Company Wallet not found');

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.companyWallet.update({
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
          recruiterId,
        },
      }),
    ]);

    return { updatedWallet, transaction };
  }

  async deductCvUnlock(recruiterId: string, description: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { company: { include: { wallet: true } } },
    });

    if (!recruiter?.company?.wallet)
      throw new NotFoundException('Company Wallet not found');
    const wallet = recruiter.company.wallet;

    if (wallet.cvUnlockQuota > 0) {
      const [updatedWallet, transaction] = await this.prisma.$transaction([
        this.prisma.companyWallet.update({
          where: { walletId: wallet.walletId },
          data: { cvUnlockQuota: { decrement: 1 } },
        }),
        this.prisma.transaction.create({
          data: {
            amount: 0,
            type: TransactionType.OPEN_CV,
            description: `${description} (Miễn phí từ Gói CV Hunter)`,
            walletId: wallet.walletId,
            recruiterId,
          },
        }),
      ]);
      return { updatedWallet, transaction, usedQuota: true, cost: 0 };
    }

    const cost = 30;
    if (wallet.balance < cost)
      throw new BadRequestException(
        `Cần ${cost} Xu để mở khóa liên hệ. Vui lòng nạp thêm Xu vào Ví Công ty!`,
      );

    const [updatedWallet, transaction] = await this.prisma.$transaction([
      this.prisma.companyWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { decrement: cost } },
      }),
      this.prisma.transaction.create({
        data: {
          amount: cost,
          type: TransactionType.OPEN_CV,
          description: `${description} (Phí sỉ ${cost} xu)`,
          walletId: wallet.walletId,
          recruiterId,
        },
      }),
    ]);

    return { updatedWallet, transaction, usedQuota: false, cost };
  }
}
