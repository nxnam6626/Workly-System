require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.jobPosting.updateMany({
    where: { matchingStatus: 'PENDING' },
    data: { matchingStatus: 'COMPLETED', lastMatchedAt: new Date() }
  });
  console.log('Updated jobs:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
