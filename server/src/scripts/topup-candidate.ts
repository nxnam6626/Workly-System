import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  family: 4,
} as any);
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const TARGET_ID = '4348f444-0cd1-43d5-a74a-6d3ee555dad4'; // Nguyễn Ngọc Thanh

async function main() {
  console.log('🧹 Reversing deposits for other candidates to keep database clean...');

  // Find all transactions with description 'Nạp tiền vào tài khoản ứng viên (Admin Tool)'
  const transactions = await prisma.candidateTransaction.findMany({
    where: {
      description: 'Nạp tiền vào tài khoản ứng viên (Admin Tool)',
      candidateId: {
        not: TARGET_ID
      }
    }
  });

  console.log(`📋 Found ${transactions.length} transactions to reverse.`);
  for (const tx of transactions) {
    console.log(`- Reversing Tx: ${tx.transactionId} for Candidate ID: ${tx.candidateId}`);

    // Subtract amount from wallet balance
    await prisma.candidateWallet.update({
      where: { candidateId: tx.candidateId! },
      data: {
        balance: { decrement: tx.amount }
      }
    });

    // Delete the transaction
    await prisma.candidateTransaction.delete({
      where: { transactionId: tx.transactionId }
    });

    console.log(`  Successfully reversed.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
