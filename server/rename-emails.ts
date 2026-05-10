import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.log('Renaming demo account emails from @workly.vn to @test.com...');

  const accounts = [
    { from: 'admin@workly.vn', to: 'admin@test.com' },
    { from: 'candidate@workly.vn', to: 'candidate@test.com' },
    { from: 'recruiter@workly.vn', to: 'recruiter@test.com' }
  ];

  for (const account of accounts) {
    try {
      const user = await prisma.user.findUnique({ where: { email: account.from } });
      if (user) {
        await prisma.user.update({
          where: { userId: user.userId },
          data: { email: account.to }
        });
        console.log(`Successfully updated: ${account.from} -> ${account.to}`);
      } else {
        // Check if it already exists with the 'to' name to prevent duplicate running errors
        const checkExists = await prisma.user.findUnique({ where: { email: account.to } });
        if (checkExists) {
          console.log(`User ${account.to} already exists.`);
        } else {
          console.log(`Original user ${account.from} not found.`);
        }
      }
    } catch (error) {
      console.error(`Error processing ${account.from}:`, error);
    }
  }

  console.log('Task COMPLETED!');
}

main().catch(console.error).finally(() => process.exit(0));
