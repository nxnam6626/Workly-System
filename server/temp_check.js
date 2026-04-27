const { PrismaClient } = require('./src/generated/prisma/index.js');
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.jobPosting.findMany({
    where: { title: { contains: 'Senior Backend Developer' } },
    select: { jobPostingId: true, title: true, status: true, companyId: true }
  });
  console.log(JSON.stringify(jobs, null, 2));
}
main().finally(() => prisma.$disconnect());
