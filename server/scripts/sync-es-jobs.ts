import { PrismaClient, JobStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { Client } from '@elastic/elasticsearch';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set in .env');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const esClient = new Client({
  node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
});

async function main() {
  console.log('--- RE-SYNCING ALL APPROVED JOBS TO ELASTICSEARCH ---');
  
  // 1. Fetch all approved jobs with company data
  const jobs = await prisma.jobPosting.findMany({
    where: { status: JobStatus.APPROVED },
    include: { company: true },
  });

  console.log(`Found ${jobs.length} approved jobs in Database.`);

  // 2. Sync each job to ES
  for (const job of jobs) {
    try {
      await esClient.index({
        index: 'jobs',
        id: job.jobPostingId,
        body: {
          title: job.title,
          description: job.description,
          companyId: job.companyId,
          companyName: job.company?.companyName || undefined,
          originalUrl: job.originalUrl,
          locationCity: job.locationCity,
          jobType: job.jobType,
          salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
          experience: job.experience,
          status: job.status,
          createdAt: job.createdAt,
        },
      });
      console.log(`✓ Indexed: ${job.title} (${job.jobPostingId})`);
    } catch (err: any) {
      console.error(`✗ Error indexing job ${job.jobPostingId}:`, err.message);
    }
  }

  console.log('--- SYNC COMPLETED ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
