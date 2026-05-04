import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const totalCount = await prisma.recruiter.count();
  const recruiters = await prisma.recruiter.findMany({
    take: 10,
    include: {
      user: true,
    },
  });

  console.log(`Total recruiters: ${totalCount}`);
  console.log('\nSample Recruiters (First 10):');
  recruiters.forEach((r, index) => {
    console.log(`${index + 1}. Email: ${r.user.email} | Name: ${r.fullName}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
