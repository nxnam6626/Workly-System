const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { violations: { gt: 0 } },
    select: { userId: true, violations: true, email: true }
  });
  console.log('Users with violations:', users);

  for (let u of users) {
    let r = await prisma.recruiter.updateMany({
      where: { userId: u.userId },
      data: { violationCount: u.violations }
    });
    console.log('Updated recruiter for', u.email, 'count:', r.count);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
