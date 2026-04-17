import { Module, forwardRef } from '@nestjs/common';
import { RecruitersService } from './recruiters.service';
import { RecruitersController } from './recruiters.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UnlockService } from './unlock.service';
import { MatchingService } from '../search/matching.service';

import { MessagesModule } from '../messages/messages.module';
import { SearchModule } from '../search/search.module';
import { WalletsModule } from '../wallets/wallets.module';

@Module({
  imports: [PrismaModule, MessagesModule, forwardRef(() => SearchModule), WalletsModule],
  controllers: [RecruitersController],
  providers: [
    RecruitersService,
    JwtAuthGuard,
    RolesGuard,
    UnlockService,
    MatchingService,
  ],
  exports: [RecruitersService, UnlockService],
})
export class RecruitersModule {}
