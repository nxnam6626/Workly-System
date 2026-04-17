import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, AiModule, SupabaseModule],
  controllers: [MessagesController],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService, MessagesGateway],
})
export class MessagesModule {}
