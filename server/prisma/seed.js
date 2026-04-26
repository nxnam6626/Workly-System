const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Clean up existing roles (optional, but good for consistency)
  // We upsert roles instead of deleting to keep ID consistency if needed
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'ADMIN' },
    update: {},
    create: { roleName: 'ADMIN' },
  });

  const candidateRole = await prisma.role.upsert({
    where: { roleName: 'CANDIDATE' },
    update: {},
    create: { roleName: 'CANDIDATE' },
  });

  const recruiterRole = await prisma.role.upsert({
    where: { roleName: 'RECRUITER' },
    update: {},
    create: { roleName: 'RECRUITER' },
  });

  // 2. Create Supreme Admin
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {
        admin: {
            upsert: {
                update: { permissions: ['SUPER_ADMIN'] },
                create: { permissions: ['SUPER_ADMIN'] }
            }
        }
    },
    create: {
      email: 'admin@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: { roleId: adminRole.roleId },
      },
      admin: {
        create: {
          permissions: ['SUPER_ADMIN'],
        },
      },
      candidate: {
        create: {
          fullName: 'System Admin',
        },
      },
    },
  });

  console.log('✅ Admin account ensured: admin@test.com / password123');
  console.log('✅ Permissions: SUPER_ADMIN');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
