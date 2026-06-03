const { PrismaClient } = require('../src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const targetIds = [
    'd3ab2f08-f939-4218-afd9-7a4643cf5637', // 15-20 triệu
    '2c7affa8-2278-4eba-afe0-037e30bef275'  // 14-16 triệu
  ];

  console.log('Starting deletion process for job posting IDs:', targetIds);

  await prisma.$transaction(async (tx) => {
    // 1. Delete candidate unlocks associated with these job postings
    const deletedUnlocksCount = await tx.candidateUnlock.deleteMany({
      where: {
        jobPostingId: {
          in: targetIds
        }
      }
    });
    console.log(`Deleted ${deletedUnlocksCount.count} CandidateUnlock records.`);

    // 2. Delete job postings
    const deletedJobsCount = await tx.jobPosting.deleteMany({
      where: {
        jobPostingId: {
          in: targetIds
        }
      }
    });
    console.log(`Deleted ${deletedJobsCount.count} JobPosting records.`);
  });

  console.log('Successfully completed deletion.');
}

main()
  .catch(e => console.error('Error during deletion:', e))
  .finally(() => prisma.$disconnect());
