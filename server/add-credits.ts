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

  const email = 'nguyenduytien2905@gmail.com';
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      recruiter: {
        include: {
          company: {
            include: { wallet: true }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('User not found!');
    return;
  }

  if (!user.recruiter) {
    console.log('User is not a recruiter!');
    return;
  }

  if (!user.recruiter.company) {
    console.log('Recruiter does not have a company!');
    return;
  }

  let wallet = user.recruiter.company.wallet;
  
  if (!wallet) {
    wallet = await prisma.companyWallet.create({
      data: {
        companyId: user.recruiter.companyId as string,
        balance: 1000000,
        cvUnlockQuota: 100,
        cvUnlockQuotaMax: 100,
      }
    });
    console.log('Created wallet and added 1,000,000 credits');
  } else {
    wallet = await prisma.companyWallet.update({
      where: { walletId: wallet.walletId },
      data: { balance: wallet.balance + 1000000 }
    });
    console.log(`Updated wallet balance! New balance: ${wallet.balance}`);
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => process.exit(0));
