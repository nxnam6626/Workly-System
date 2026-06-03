import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { PrismaModule } from '@/prisma/prisma.module';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { AiModule } from '@/modules/intelligence/ai/ai.module';
import { WalletsModule } from '@/modules/billing/wallets/wallets.module';

import { MailModule } from '@/mail/mail.module';

@Module({
  imports: [
    PrismaModule,
    NotificationsModule,
    MessagesModule,
    SupabaseModule,
    AiModule,
    WalletsModule,
    MailModule,
  ],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
