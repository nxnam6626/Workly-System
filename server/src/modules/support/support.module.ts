import { Module } from '@nestjs/common';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, NotificationsModule, MessagesModule],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
