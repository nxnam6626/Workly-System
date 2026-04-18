const { PrismaClient } = require('../src/generated/prisma'); // Fixed path
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const jobId = "09c211db-2c8f-4a9b-9314-a422823aff73";
    const email = "zighdevil@gmail.com";

    console.log("--- JOB INFO ---");
    const job = await prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      select: {
        title: true,
        structuredRequirements: true,
        status: true,
        vacancies: true
      }
    });
    console.log(JSON.stringify(job, null, 2));

    console.log("\n--- CANDIDATE & CV INFO ---");
    const user = await prisma.user.findUnique({
      where: { email },
      select: { userId: true }
    });

    if (!user) {
      console.log("User not found with email:", email);
      return;
    }

    const candidate = await prisma.candidate.findUnique({
      where: { userId: user.userId },
      include: {
        cvs: {
          where: { parsedData: { not: null } }
        }
      }
    });

    if (!candidate) {
      console.log("Candidate record not found for user:", user.userId);
    } else {
      console.log(JSON.stringify(candidate, null, 2));
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch(e => console.error(e));
