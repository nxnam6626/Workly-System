import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: {
      title: {
        contains: 'Product Manager - Vacancy 50',
      },
    },
  });
  console.log('Found jobs:', JSON.stringify(jobs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
