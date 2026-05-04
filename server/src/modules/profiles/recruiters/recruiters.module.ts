import { Module, forwardRef } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UnlockService } from './unlock.service';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { SearchModule } from '@/modules/intelligence/search/search.module';
import { WalletsModule } from '@/modules/billing/wallets/wallets.module';

@Module({
  imports: [
    PrismaModule,
    MessagesModule,
    forwardRef(() => SearchModule),
    WalletsModule,
  ],
  controllers: [RecruitersController],
  providers: [RecruitersService, JwtAuthGuard, RolesGuard, UnlockService],
  exports: [RecruitersService, UnlockService],
})
export class RecruitersModule {}
