const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const job = await prisma.jobPosting.findFirst({ orderBy: { createdAt: 'desc' } });
  console.log('Latest Job:', job?.title, 'ID:', job?.jobPostingId);
  if (job?.jobPostingId) {
    const matches = await prisma.jobMatch.count({ where: { jobPostingId: job.jobPostingId } });
    console.log('Number of matches for this job:', matches);
  }
}
main().finally(() => prisma.$disconnect());
