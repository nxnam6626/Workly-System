const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const company = await prisma.company.findFirst({
    where: { companyName: { contains: "Worklink" } },
    include: {
      recruiters: true // Checking if relations exist depending on schema structure
    }
  });
  console.log("\n--- COMPANY INFO ---");
  console.log(JSON.stringify(company, null, 2));
  
  const allRecruiters = await prisma.recruiter.findMany({
      take: 5,
      include: { user: true, company: true }
  });
  console.log("\n--- CURRENT RECRUITERS IN SYSTEM ---");
  allRecruiters.forEach(r => {
      console.log(`ID: ${r.recruiterId} | Email: ${r.user.email} | Company Assigned: ${r.company?.companyName || 'NONE'}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
