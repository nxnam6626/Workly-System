import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { SupabaseModule } from '@/common/supabase/supabase.module';
import { MessagesModule } from '@/modules/communication/messages/messages.module';
import { NotificationsModule } from '@/modules/communication/notifications/notifications.module';

import { CompanyReviewsModule } from './reviews/company-reviews.module';

@Module({
  imports: [SupabaseModule, MessagesModule, NotificationsModule, CompanyReviewsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
