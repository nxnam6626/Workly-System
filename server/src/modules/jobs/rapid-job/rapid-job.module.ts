import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { RapidJobService } from './rapid-job.service';
import { RapidJobController } from './rapid-job.controller';
import { RapidJobSchedulerService } from './rapid-job-scheduler.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { SearchModule } from '../../search/search.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    PrismaModule,
    SearchModule,
  ],
  controllers: [RapidJobController],
  providers: [RapidJobService, RapidJobSchedulerService],
  exports: [RapidJobService],
})
export class RapidJobModule { }
