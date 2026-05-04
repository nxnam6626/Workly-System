import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'hr@vietjetair.com.vn';
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true },
  });

  if (!user || !user.password) {
    console.log(`User ${email} not found or has no password.`);
    return;
  }

  const isMatch = await bcrypt.compare('password123', user.password);
  console.log(`Password 'password123' for ${email}: ${isMatch ? 'MATCH' : 'NO MATCH'}`);
  console.log(`Hash: ${user.password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
