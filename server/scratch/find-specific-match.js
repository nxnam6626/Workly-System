require('dotenv').config();
const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../src/generated/prisma'));
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  await prisma.$connect();

  const matches = await prisma.jobMatch.findMany({
    include: {
      candidate: true,
      jobPosting: true
    }
  });

  console.log(`Searching through ${matches.length} matches...`);
  for (const m of matches) {
    const locDetails = m.details?.details?.locationDetails;
    if (locDetails) {
      const jl = String(locDetails.jobLocation || '').toLowerCase();
      const cl = String(locDetails.candLocation || '').toLowerCase();
      
      if (jl.includes('hồ chí minh') && cl.includes('đồng nai')) {
        console.log(`MATCH FOUND:`);
        console.log(`Candidate: ${m.candidate.fullName} (ID: ${m.candidateId})`);
        console.log(`Job: ${m.jobPosting.title} (ID: ${m.jobPostingId})`);
        console.log(`Score: ${m.score}%`);
        console.log(`Details:`, JSON.stringify(m.details, null, 2));
        console.log('-------------------------------------------');
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
