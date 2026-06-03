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
  const email = 'nguyenduytien2905@gmail.com';
  const newPassword = 'password123';
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { password: passwordHash }
  });

  console.log(`Successfully updated password for ${email} to "${newPassword}"`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
