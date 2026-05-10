const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🔍 AGGREGATE DIAGNOSIS - SUMMARY MODE:");

  const companies = await prisma.company.findMany({
    where: { companyName: { contains: 'WORKLINK', mode: 'insensitive' } },
    include: {
       _count: { select: { jobPostings: true } }
    }
  });

  console.log(`Found ${companies.length} matches in Database:`);

  for (const c of companies) {
     console.log(`\n------------------------------------------------`);
     console.log(`🏢 COMPANY: ${c.companyName}`);
     console.log(`🆔 ID: ${c.companyId}`);
     console.log(`📄 TAX CODE: ${c.taxCode}`);
     console.log(`📦 TOTAL JOBS IN DB: ${c._count.jobPostings}`);
     
     const approved = await prisma.jobPosting.count({ where: { companyId: c.companyId, status: 'APPROVED' } });
     const pending = await prisma.jobPosting.count({ where: { companyId: c.companyId, status: 'PENDING' } });
     const draft = await prisma.jobPosting.count({ where: { companyId: c.companyId, status: 'DRAFT' } });
     
     console.log(`✅ APPROVED: ${approved}`);
     console.log(`⏳ PENDING: ${pending}`);
     console.log(`📝 DRAFT: ${draft}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });
