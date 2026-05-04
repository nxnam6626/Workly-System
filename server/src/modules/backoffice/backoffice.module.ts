import { Module } from '@nestjs/common';
import { BackofficeService } from '@/modules/backoffice/backoffice.service';
import { BackofficeController } from '@/modules/backoffice/backoffice.controller';

@Module({
  controllers: [BackofficeController],
  providers: [BackofficeService],
})
export class BackofficeModule {}
