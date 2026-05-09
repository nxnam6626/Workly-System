const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.transaction.deleteMany({});
  console.log('Transactions deleted');
}
main().finally(() => prisma.$disconnect());
