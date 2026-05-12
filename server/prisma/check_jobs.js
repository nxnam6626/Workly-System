const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.jobPosting.count();
  console.log('TOTAL JOB POSTINGS:', count);

  const groupStats = await prisma.jobPosting.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('BY STATUS:', groupStats);

  const groupApproved = await prisma.jobPosting.groupBy({
    by: ['isApproved'],
    _count: true
  });
  console.log('BY IS_APPROVED:', groupApproved);

  const now = new Date();
  const active = await prisma.jobPosting.count({
    where: {
      status: 'PUBLISHED',
      isApproved: true,
      deadline: {
        gte: now
      }
    }
  });
  console.log('FULLY ELIGIBLE ACTIVE JOBS:', active);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
