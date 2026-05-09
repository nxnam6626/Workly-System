import { PrismaClient } from '../src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
// @ts-ignore
const prisma = new PrismaClient({ adapter });

async function main() {
  // @ts-ignore
  const companies = await prisma.company.findMany({
    select: {
      companyId: true,
      companyName: true,
    }
  });

  console.log('--- COMPANIES IN DATABASE ---');
  console.log(JSON.stringify(companies, null, 2));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
