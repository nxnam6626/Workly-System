import { Injectable } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import { WalletBalanceService } from './services/wallet-balance.service';
import { WalletPaymentService } from './services/wallet-payment.service';

@Injectable()
export class WalletsService {
  constructor(
    private readonly balanceService: WalletBalanceService,
    private readonly paymentService: WalletPaymentService,
  ) { }

  // --- Balance & Transaction History ---
  async getBalance(userId: string) {
    return this.balanceService.getBalance(userId);
  }

  async getTransactions(userId: string) {
    return this.balanceService.getTransactions(userId);
  }

  async deduct(recruiterId: string, amount: number, description: string, type: TransactionType = TransactionType.OPEN_CV) {
    return this.balanceService.deduct(recruiterId, amount, description, type);
  }

  async add(recruiterId: string, amount: number, description: string, type: TransactionType = TransactionType.DEPOSIT) {
    return this.balanceService.add(recruiterId, amount, description, type);
  }

  async addCvQuota(recruiterId: string, quotaAmount: number, description: string) {
    return this.balanceService.addCvQuota(recruiterId, quotaAmount, description);
  }

  async deductCvUnlock(recruiterId: string, description: string) {
    return this.balanceService.deductCvUnlock(recruiterId, description);
  }

  // --- Payment Gateway (PayOS) ---
  async createPaymentLink(userId: string, targetXu: number) {
    return this.paymentService.createPaymentLink(userId, targetXu);
  }

  async resumePaymentLink(userId: string, transactionId: string) {
    return this.paymentService.resumePaymentLink(userId, transactionId);
  }

  async verifyWebhook(body: any) {
    return this.paymentService.verifyWebhook(body);
  }
}
