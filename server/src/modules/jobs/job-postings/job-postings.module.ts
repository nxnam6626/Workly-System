import { Module } from '@nestjs/common';
import { JobPostingsService } from './job-postings.service';
import { JobPostingsController } from './job-postings.controller';
import { AdminJobPostingsController } from './admin-job-postings.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobPostingsController, AdminJobPostingsController],
  providers: [JobPostingsService],
})
export class JobPostingsModule { }
