import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  try {
    const internshipCount = await prisma.jobPosting.count({
      where: { jobType: 'INTERNSHIP' }
    });
    console.log(`INTERNSHIP_COUNT: ${internshipCount}`);
    
    if (internshipCount > 0) {
        const jobs = await prisma.jobPosting.findMany({
            where: { jobType: 'INTERNSHIP' },
            take: 5
        });
        console.log('Sample internship jobs:', JSON.stringify(jobs, null, 2));
    }
  } catch (error) {
    console.error('Error checking internships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
