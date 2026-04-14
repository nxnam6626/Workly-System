import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.jobMatch.count();
  console.log('JobMatches count:', count);
  
  const matches = await prisma.jobMatch.findMany({ take: 2 });
  if (matches.length > 0) {
     console.log("Sample matches found:", matches);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
