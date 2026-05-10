import { Injectable } from '@nestjs/common';
import { CandidateWalletBalanceService } from './services/candidate-wallet-balance.service';
import { CandidateWalletPaymentService } from './services/candidate-wallet-payment.service';

@Injectable()
export class CandidateWalletsService {
  constructor(
    private readonly balanceService: CandidateWalletBalanceService,
    private readonly paymentService: CandidateWalletPaymentService,
  ) {}

  async getBalance(userId: string) {
    return this.balanceService.getBalance(userId);
  }

  async getTransactions(userId: string, skip?: number, take?: number) {
    return this.balanceService.getTransactions(userId, skip, take);
  }

  async activateJobSearch(candidateId: string) {
    return this.balanceService.activateJobSearch(candidateId);
  }

  async topUp(userId: string, amountVND: number) {
    return this.paymentService.createPaymentLink(userId, amountVND);
  }

  async handleWebhook(body: any) {
    return this.paymentService.verifyWebhook(body);
  }
}
