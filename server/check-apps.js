process.env.DATABASE_URL='postgresql://postgres:admin@localhost:5432/workly_system';
const { PrismaClient } = require('@prisma/client'); 
const prisma = new PrismaClient(); 

async function main() { 
  const apps = await prisma.application.findMany({
    include: {
      jobPosting: { select: { title: true } }
    }
  }); 
  const summary = apps.map(a => ({
    id: a.applicationId,
    status: a.status,
    jobId: a.jobPostingId,
    title: a.jobPosting?.title
  }));
  console.log('Apps:', summary.length); 
  console.log(JSON.stringify(summary, null, 2)); 
} 
main().finally(() => prisma.$disconnect());
