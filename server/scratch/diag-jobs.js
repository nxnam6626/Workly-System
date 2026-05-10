const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log("🔍 DIAGNOSING JOB POSTINGS FOR WORKLINK...");

  const companies = await prisma.company.findMany({
    where: { companyName: { contains: 'WORKLINK', mode: 'insensitive' } },
    include: {
       _count: { select: { jobPostings: true } }
    }
  });

  console.log(`Found ${companies.length} matching Company entities.`);

  for (const c of companies) {
     console.log(`\n🏢 Company: ${c.companyName} | ID: ${c.companyId} | Tax: ${c.taxCode}`);
     console.log(`   Jobs Count Total: ${c._count.jobPostings}`);
     
     // Deep scan job statuses attached directly
     const jobs = await prisma.jobPosting.findMany({
         where: { companyId: c.companyId }
     });
     
     jobs.forEach(j => {
         console.log(`   - [${j.status}] ${j.title} (Job ID: ${j.jobPostingId})`);
     });
  }

  console.log('\n🔍 CHECKING ENDPOINT RESTRICTIONS:');
  console.log('The public profile endpoint often filters by status: "APPROVED". Are the jobs still in DRAFT or PENDING?');
}

main()
  .catch(e => console.error(e))
  .finally(async () => { await prisma.$disconnect(); });
