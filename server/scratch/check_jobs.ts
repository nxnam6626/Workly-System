
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: {
      title: { contains: 'Senior Backend Developer', mode: 'insensitive' }
    },
    select: {
      jobPostingId: true,
      title: true,
      jobLevel: true,
      status: true
    }
  });

  console.log('--- FOUND JOBS ---');
  console.log(JSON.stringify(jobs, null, 2));

  const internJobs = await prisma.jobPosting.findMany({
    where: {
      jobLevel: 'INTERN'
    },
    take: 5,
    select: {
      title: true,
      jobLevel: true
    }
  });

  console.log('--- FIRST 5 INTERN JOBS ---');
  console.log(JSON.stringify(internJobs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
