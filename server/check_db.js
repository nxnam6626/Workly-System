const { PrismaClient } = require('./src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
  const job = await prisma.jobPosting.findUnique({
    where: { jobPostingId: 'd75c72b0-ad4e-4344-8339-3c33b36cb199' },
    include: {
      matches: {
        include: { candidate: { select: { user: { select: { fullName: true } } } } }
      }
    }
  });
  console.log('--- Job Status ---');
  console.log('ID:', job.jobPostingId);
  console.log('Title:', job.title);
  console.log('Status:', job.status);
  console.log('Matches count:', job.matches.length);
  
  const recommended = await prisma.jobMatch.findMany({
    where: {
      candidateId: job.matches[0]?.candidateId,
      jobPosting: { status: 'APPROVED' }
    },
    include: { jobPosting: true }
  });
  console.log('\n--- Recommended Jobs for Candidate ---');
  recommended.forEach(r => {
    console.log(r.jobPosting.title, '-', r.jobPosting.status);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
