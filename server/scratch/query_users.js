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
    take: 10,
    select: {
      email: true,
      status: true,
      userRoles: {
        select: {
          role: {
            select: {
              roleName: true
            }
          }
        }
      }
    }
  });
  console.log("USERS_LIST:");
  users.forEach(u => {
    const roles = u.userRoles.map(ur => ur.role.roleName).join(', ');
    console.log(`- Email: ${u.email} | Status: ${u.status} | Roles: ${roles}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
