const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function checkUserRoles() {
  const email = 'zighdevil@gmail.com';
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    console.log(`User ${email} not found`);
  } else {
    console.log(`User: ${user.email}`);
    console.log(`Roles:`, user.userRoles.map(ur => ur.role.roleName));
  }
  await prisma.$disconnect();
}

checkUserRoles();
