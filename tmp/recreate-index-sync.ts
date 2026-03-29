import { NestFactory } from '@nestjs/core';
import { AppModule } from '../server/src/app.module';
import { SearchService } from '../server/src/modules/search/search.service';
import { JobPostingsService } from '../server/src/modules/jobs/job-postings/job-postings.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const searchService = app.get(SearchService);
  const jobService = app.get(JobPostingsService);

  console.log('--- RECREATING ES INDEX ---');
  try {
    await searchService.recreateIndex();
    console.log('Index recreated successfully with new mappings.');

    console.log('--- STARTING CLEAN SYNC ---');
    const result = await jobService.syncAllJobsToES();
    console.log(`Sync complete! Re-indexed ${result.count} jobs.`);
  } catch (error) {
    console.error('Operation failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
