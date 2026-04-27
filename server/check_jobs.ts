import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: {
      OR: [
        { title: { contains: 'thể thao', mode: 'insensitive' } },
        { title: { contains: 'thao', mode: 'insensitive' } },
        { title: { contains: 'chuyên viên', mode: 'insensitive' } }
      ]
    },
    select: {
      jobPostingId: true,
      title: true,
      status: true
    },
    take: 20
  });
  console.log('Jobs found:', JSON.stringify(jobs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
