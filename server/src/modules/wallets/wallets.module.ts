import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { WalletBalanceService } from './services/wallet-balance.service';
import { WalletPaymentService } from './services/wallet-payment.service';

@Module({
  imports: [PrismaModule, MessagesModule],
  controllers: [WalletsController],
  providers: [WalletsService, WalletBalanceService, WalletPaymentService],
  exports: [WalletsService, WalletBalanceService, WalletPaymentService],
})
export class WalletsModule {}
