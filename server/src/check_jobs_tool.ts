import { PrismaService } from './prisma/prisma.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    const count = await prisma.jobPosting.count();
    console.log('=== DATABASE DUMP ===');
    console.log('Total Job Postings:', count);

    const groupStats = await prisma.jobPosting.groupBy({
      by: ['status'],
      _count: true
    });
    console.log('Grouped By Status:', JSON.stringify(groupStats, null, 2));

    const sample = await prisma.jobPosting.findMany({
      take: 3,
      select: { title: true, status: true, recruiterId: true }
    });
    console.log('Sample 3 Jobs (with owners):', JSON.stringify(sample, null, 2));

    const totalRecruiters = await prisma.recruiter.count();
    console.log('Total Recruiters In DB:', totalRecruiters);

    const firstRecruiter = await prisma.recruiter.findFirst({
      select: { recruiterId: true, userId: true, user: { select: { email: true } } }
    });
    console.log('Sample Recruiter Account:', firstRecruiter);
  } catch (err) {
    console.error('FATAL:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
