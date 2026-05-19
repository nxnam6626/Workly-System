const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const tx = await prisma.transaction.findMany();
  console.log('Transactions:', tx.length, tx);
  const ctx = await prisma.candidateTransaction.findMany();
  console.log('CandidateTransactions:', ctx.length, ctx);
}
main().catch(console.error).finally(() => prisma.$disconnect());
