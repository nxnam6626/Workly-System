const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: {
      title: 'Automation Tester',
      company: {
        companyName: {
          contains: 'MISA'
        }
      }
    },
    include: {
      company: true,
      applications: true,
      candidateUnlocks: true,
      jobMatches: true,
      savedJobs: true,
      branches: true
    }
  });

  console.log(`Found ${jobs.length} jobs matching "Automation Tester" at "MISA":`);
  jobs.forEach(job => {
    console.log(`- ID: ${job.jobPostingId}`);
    console.log(`  Title: ${job.title}`);
    console.log(`  Company: ${job.company.companyName}`);
    console.log(`  SalaryMin: ${job.salaryMin}, SalaryMax: ${job.salaryMax}`);
    console.log(`  Applications count: ${job.applications.length}`);
    console.log(`  CandidateUnlocks count: ${job.candidateUnlocks.length}`);
    console.log(`  JobMatches count: ${job.jobMatches.length}`);
    console.log(`  SavedJobs count: ${job.savedJobs.length}`);
    console.log(`  Branches count: ${job.branches.length}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
