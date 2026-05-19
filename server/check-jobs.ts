import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { company: true }
  });
  console.log(JSON.stringify(jobs.map(j => ({
    id: j.jobPostingId,
    title: j.title,
    status: j.status,
    company: j.company.companyName,
    createdAt: j.createdAt
  })), null, 2));
}

main().finally(() => prisma.$disconnect());
