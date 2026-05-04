import { Module } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { BackofficeController } from './backoffice.controller';

@Module({
  controllers: [BackofficeController],
  providers: [BackofficeService],
})
export class BackofficeModule {}
