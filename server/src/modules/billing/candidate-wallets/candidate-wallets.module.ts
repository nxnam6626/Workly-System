import { Module } from '@nestjs/common';
import { CandidateWalletsService } from './candidate-wallets.service';
import { CandidateWalletsController } from './candidate-wallets.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { CandidateWalletBalanceService } from './services/candidate-wallet-balance.service';
import { CandidateWalletPaymentService } from './services/candidate-wallet-payment.service';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [CandidateWalletsController],
  providers: [
    CandidateWalletsService, 
    CandidateWalletBalanceService, 
    CandidateWalletPaymentService
  ],
  exports: [
    CandidateWalletsService, 
    CandidateWalletBalanceService, 
    CandidateWalletPaymentService
  ],
})
export class CandidateWalletsModule {}
