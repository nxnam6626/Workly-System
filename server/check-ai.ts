import { PrismaClient } from '@prisma/client'; 

const prisma = new PrismaClient(); 

async function main() { 
  const job = await prisma.jobPosting.findFirst({ 
    orderBy: { createdAt: 'desc' }, 
    select: { title: true, jobTier: true, structuredRequirements: true } 
  }); 
  console.log(JSON.stringify(job, null, 2)); 
} 

main().catch(console.error).finally(() => prisma.$disconnect());
