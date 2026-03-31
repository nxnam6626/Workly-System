const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const admins = await prisma.user.findMany({
    where: { userRoles: { some: { role: { roleName: 'ADMIN' } } } },
    include: {
      userRoles: { include: { role: true } }
    }
  });
  console.log('Found Admins:', JSON.stringify(admins, null, 2));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
