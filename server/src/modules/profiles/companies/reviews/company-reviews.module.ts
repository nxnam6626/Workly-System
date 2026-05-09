import { Module } from '@nestjs/common';
import { CompanyReviewsController } from './company-reviews.controller';
import { CompanyReviewsService } from './company-reviews.service';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [CompanyReviewsService],
  controllers: [CompanyReviewsController],
  exports: [CompanyReviewsService],
})
export class CompanyReviewsModule {}
