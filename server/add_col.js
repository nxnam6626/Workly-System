const { PrismaClient } = require('./dist/src/generated/prisma');
const prisma = new PrismaClient();
async function m() {
  await prisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS vector;');
  console.log('Done!');
}
m().catch(console.log).finally(() => prisma.$disconnect());
