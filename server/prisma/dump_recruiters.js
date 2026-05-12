const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: {
      userRoles: {
        some: {
          role: {
            roleName: 'RECRUITER'
          }
        }
      }
    },
    select: {
      email: true,
      status: true
    },
    take: 5
  });
  
  console.log("--- RECRUITER ACCOUNTS ---");
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
