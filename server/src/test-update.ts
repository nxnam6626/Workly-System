import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const reqs = await prisma.supportRequest.findMany({ 
    where: { userId: null }
  });
  
  if (reqs.length === 0) {
    console.log("No anonymous tickets found.");
    return;
  }

  for (const req of reqs) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: req.email, mode: 'insensitive' } }
    });
    if (user) {
      await prisma.supportRequest.update({
        where: { requestId: req.requestId },
        data: { userId: user.userId }
      });
      console.log(`Updated ticket from ${req.email} to map to ${user.userId}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
