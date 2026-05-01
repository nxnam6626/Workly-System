import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Enabling pgvector extension...');
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
  console.log('Extension enabled successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
