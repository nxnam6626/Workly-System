import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const job = await prisma.jobPosting.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  // @ts-ignore
  console.log('Job:', job.jobPostingId, 'Threshold:', job.autoInviteThreshold);
  
  const matches = await prisma.jobMatch.findMany({
    // @ts-ignore
    where: { jobPostingId: job.jobPostingId }
  });
  console.log('Matches:', matches.map(m => m.score));
}

main().finally(() => prisma.$disconnect());
