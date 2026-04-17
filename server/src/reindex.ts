import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { SearchService } from './modules/search/search.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  const searchService = app.get(SearchService);

  console.log('Recreating index...');
  await searchService.recreateIndex();

  const jobs = await prisma.jobPosting.findMany({
    where: { status: 'APPROVED' },
    include: { company: true },
  });

  console.log(`Found ${jobs.length} approved jobs to index.`);

  for (const job of jobs) {
    await searchService.indexJob({
      id: job.jobPostingId,
      title: job.title,
      companyId: job.companyId,
      companyName: job.company.companyName,
      originalUrl: job.originalUrl,
      locationCity: job.locationCity || '',
      jobType: job.jobType || '',
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      experience: job.experience || '',
      status: job.status,
      createdAt: job.createdAt,
      refreshedAt: job.refreshedAt,
      jobTier: job.jobTier,
    });
  }

  console.log('Reindexing complete.');
  await app.close();
}

bootstrap();
