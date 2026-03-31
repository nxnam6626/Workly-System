import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/src/app.module';
import { JobPostingsService } from '../server/src/modules/jobs/job-postings/job-postings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const jobService = app.get(JobPostingsService);

  console.log('Starting manual ES sync...');
  try {
    const result = await jobService.syncAllJobsToES();
    console.log(`Sync complete! Indexed ${result.count} jobs.`);
  } catch (error) {
    console.error('Sync failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
