import * as dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const cvs = await prisma.cV.findMany({
    select: { cvId: true, cvTitle: true, fileHash: true, candidate: { select: { fullName: true } } }
  });
  console.log('--- CURRENT CV DB RECORDS ---');
  console.log(JSON.stringify(cvs, null, 2));
  console.log('--- END RECORDS ---');
  await prisma.$disconnect();
  await pool.end();
}

main().catch(console.error);
