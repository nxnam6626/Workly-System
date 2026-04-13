import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Transaction";`);
    console.log('Cleared Transaction table successfully.');
  } catch (err) {
    console.error('Failed to clear Transaction table', err);
  }
}

main().finally(() => prisma.$disconnect());
