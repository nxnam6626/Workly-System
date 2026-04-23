import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const companiesCount = await prisma.company.count();
  const approvedJobsCount = await prisma.jobPosting.count({
    where: { status: 'APPROVED' }
  });
  const topEmployers = await prisma.company.findMany({
    take: 12,
    include: {
      _count: {
        select: { jobPostings: { where: { status: 'APPROVED' } } },
      },
    },
    orderBy: {
      jobPostings: {
        _count: 'desc',
      },
    },
  });

  console.log('--- Database Stats ---');
  console.log('Total Companies:', companiesCount);
  console.log('Total Approved Jobs:', approvedJobsCount);
  console.log('--- Top Employers (Raw) ---');
  console.log(JSON.stringify(topEmployers, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
