const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JOB_TITLES = [
  "Frontend Developer (React)", "Backend Engineer (NodeJS)", "UI/UX Designer",
  "Data Analyst", "Project Manager", "Customer Support Specialist", "QA/Tester",
  "Product Owner", "Fullstack Developer", "Digital Marketing Lead", "Sales Manager",
  "Talent Acquisition", "Mobile Developer (Flutter)", "System Administrator"
];

async function main() {
  console.log("Fetching all companies...");
  const companies = await prisma.company.findMany({ select: { companyId: true, companyName: true } });
  console.log(`Found ${companies.length} companies. Injecting random approved jobs...`);

  let totalInjected = 0;
  for (const company of companies) {
    // Random number of jobs between 1 and 8 to create different ranking weights.
    const numJobs = Math.floor(Math.random() * 8) + 1;
    
    for(let i = 0; i < numJobs; i++) {
      const randomTitle = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
      await prisma.jobPosting.create({
        data: {
          title: randomTitle,
          description: `Mô tả chi tiết cho công việc ${randomTitle} tại ${company.companyName}`,
          requirements: "Kinh nghiệm 1-2 năm. Sẵn sàng học hỏi và thăng tiến.",
          status: 'APPROVED',
          companyId: company.companyId,
          vacancies: 1,
        }
      });
      totalInjected++;
    }
    console.log(`✅ Added ${numJobs} jobs for ${company.companyName}`);
  }

  console.log(`\n✨ INJECTION COMPLETED: Created ${totalInjected} active jobs distributed algorithmically!`);
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
