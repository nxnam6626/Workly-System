import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RapidJobService } from './rapid-job.service';
import { RapidJobController } from './rapid-job.controller';

@Module({
  imports: [
    HttpModule,      // đăng ký HttpService (wrapper của axios)
    ConfigModule,    // cho phép inject ConfigService
  ],
  controllers: [RapidJobController],
  providers: [RapidJobService],
  exports: [RapidJobService],  // export để các module khác dùng được
})
export class RapidJobModule {}
