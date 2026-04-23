import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const jobs = await prisma.jobPosting.findMany({ take: 5 });
  for (const job of jobs) {
    console.log(`Job: ${job.title}`);
    console.log(`Reqs: ${JSON.stringify(job.structuredRequirements, null, 2)}`);
  }

  await prisma.$disconnect();
}

main();
