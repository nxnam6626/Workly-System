import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const violators = await prisma.recruiter.findMany({
    where: { violationCount: { gt: 0 } },
    select: { recruiterId: true, violationCount: true, user: { select: { email: true } } }
  });
  console.log('Recruiters with violations:', JSON.stringify(violators, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
