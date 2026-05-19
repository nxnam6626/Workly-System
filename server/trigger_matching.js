const { Queue } = require('bullmq');
const IORedis = require('ioredis');
const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

async function trigger() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
  const matchingQueue = new Queue('matching', { connection });

  const jobs = await prisma.jobPosting.findMany({ where: { status: 'APPROVED' } });
  console.log(`Found ${jobs.length} APPROVED jobs to run matching for...`);
  
  for(const job of jobs) {
    await matchingQueue.add('match', { jobId: job.jobPostingId, userId: job.recruiterId });
    console.log(`Queued match for job: ${job.title} (${job.jobPostingId})`);
  }
  
  await matchingQueue.close();
  await connection.quit();
  await prisma.$disconnect();
  console.log('Done!');
}
trigger().catch(console.error);
