import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../../mail/mail.module';

import { AiModule } from '../ai/ai.module';
import { SupabaseModule } from '../../common/supabase/supabase.module';

import { ConversationService } from './services/conversation.service';
import { MessageAttachmentService } from './services/message-attachment.service';

@Module({
  imports: [PrismaModule, AuthModule, MailModule, AiModule, SupabaseModule],
  controllers: [MessagesController],
  providers: [
    MessagesService,
    MessagesGateway,
    ConversationService,
    MessageAttachmentService,
  ],
  exports: [
    MessagesService,
    MessagesGateway,
    ConversationService,
    MessageAttachmentService,
  ],
})
export class MessagesModule { }
