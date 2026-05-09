const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({ include: { evaluations: true } });
  console.log(JSON.stringify(apps.map(a => ({ id: a.applicationId, date: a.interviewDate, evals: a.evaluations.map(e => e.roundNumber) })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
