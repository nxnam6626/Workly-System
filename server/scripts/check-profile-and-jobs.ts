import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const candidate = await prisma.candidate.findFirst({
    where: { fullName: 'Nguyễn Thu Thủy' },
    include: {
      skills: true,
      experiences: true,
      projects: true,
    },
  });

  if (!candidate) {
    console.log('Candidate not found.');
    return;
  }

  console.log('--- CANDIDATE PROFILE ---');
  console.log(JSON.stringify(candidate, null, 2));

  const jobs = await prisma.jobPosting.findMany({
    take: 10,
    include: {
      company: true,
    }
  });

  console.log('\n--- AVAILABLE JOBS ---');
  console.log(`Count: ${jobs.length}`);
  if (jobs.length > 0) {
    console.log(JSON.stringify(jobs, null, 2));
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
