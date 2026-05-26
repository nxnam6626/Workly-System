const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const company = await prisma.company.findFirst({
    where: {
      companyName: {
        contains: 'MISA'
      }
    },
    include: {
      recruiters: {
        include: {
          user: true
        }
      }
    }
  });

  if (!company) {
    console.log('Company MISA not found.');
    return;
  }

  console.log(`Company: ${company.companyName} (ID: ${company.companyId})`);
  console.log('Recruiters associated:');
  company.recruiters.forEach(rec => {
    console.log(`- Recruiter ID: ${rec.recruiterId}`);
    console.log(`  Full Name: ${rec.fullName}`);
    console.log(`  User ID: ${rec.userId}`);
    console.log(`  Email: ${rec.user.email}`);
    console.log(`  Password hash: ${rec.user.password}`);
    console.log(`  Status: ${rec.user.status}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
