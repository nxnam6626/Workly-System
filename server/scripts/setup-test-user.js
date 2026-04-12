const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

async function run() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  
  const email = 'test@workly.com';
  const roleName = 'CANDIDATE';
  
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // 1. Upsert User
    const user = await prisma.user.upsert({
      where: { email },
      update: { password: hashedPassword },
      create: { 
        email, 
        password: hashedPassword, 
        status: 'ACTIVE',
        isEmailVerified: true
      }
    });

    // 2. Ensure role exists
    const role = await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName }
    });

    // 3. Link role to user
    await prisma.userRole.upsert({
      where: { 
        userId_roleId: {
          userId: user.userId,
          roleId: role.roleId
        }
      },
      update: {},
      create: {
        userId: user.userId,
        roleId: role.roleId
      }
    });

    console.log(`Test account ready: ${email} / password123`);
  } catch (error) {
    console.error('Error setting up test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
