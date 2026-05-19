const { PrismaClient } = require('./src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function run() {
  await prisma.user.deleteMany({where: {email: {startsWith: 'cand_bulk'}}});
  console.log('deleted bulk users');
}
run().catch(console.error).finally(() => prisma.$disconnect());
