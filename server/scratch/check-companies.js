const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const companies = await prisma.company.findMany({
    select: { companyName: true, companyId: true }
  });
  console.log('SUCCESSFUL COUNT:', companies.length);
  console.log(companies);
}
main().catch(console.error).finally(() => prisma.$disconnect());
