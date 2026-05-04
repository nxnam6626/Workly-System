
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.company.count();
  console.log('Company count:', count);
}
main().catch(console.error).finally(() => prisma.$disconnect());
