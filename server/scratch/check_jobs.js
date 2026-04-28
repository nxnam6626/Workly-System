
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const jobs = await prisma.jobPosting.findMany({
      where: {
        title: { contains: 'Senior Backend Developer', mode: 'insensitive' }
      },
      select: {
        title: true,
        jobLevel: true,
      }
    });
    console.log('--- SENIOR JOBS IN DB ---');
    console.log(jobs);

    const internCount = await prisma.jobPosting.count({
      where: { jobLevel: 'INTERN' }
    });
    console.log('--- TOTAL INTERN JOBS ---', internCount);

    const firstInterns = await prisma.jobPosting.findMany({
      where: { jobLevel: 'INTERN' },
      take: 5,
      select: { title: true }
    });
    console.log('--- SOME INTERN JOBS ---');
    console.log(firstInterns);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
