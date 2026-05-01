import { Module } from '@nestjs/common';
import { JobAlertsService } from './job-alerts.service';
import { JobAlertsController } from './job-alerts.controller';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [JobAlertsController],
  providers: [JobAlertsService],
  exports: [JobAlertsService],
})
export class JobAlertsModule {}
