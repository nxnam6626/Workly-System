import { Module } from '@nestjs/common';
import { BackofficeService } from '@/modules/backoffice/backoffice.service';
import { BackofficeController } from '@/modules/backoffice/backoffice.controller';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [BackofficeController],
  providers: [BackofficeService],
})
export class BackofficeModule {}
