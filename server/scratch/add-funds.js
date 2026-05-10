const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function addFunds() {
  try {
    // Search directly inside Candidate model for full name
    const candidate = await prisma.candidate.findFirst({
      where: {
        fullName: {
          contains: 'Nguyễn Xuân Nam',
          mode: 'insensitive'
        }
      }
    });

    if (!candidate) {
      console.error("CRITICAL ERROR: Candidate record for 'Nguyễn Xuân Nam' not found!");
      return;
    }

    const candidateId = candidate.candidateId;
    const depositAmount = 100000;

    console.log(`Found Candidate Account: ${candidate.fullName} (CandidateID: ${candidateId})`);
    
    // Perform atomical deposit logic mimicking CandidateWalletBalanceService.ts
    const wallet = await prisma.candidateWallet.upsert({
      where: { candidateId },
      create: { candidateId, balance: 0 },
      update: {},
    });

    const [updatedWallet, transaction] = await prisma.$transaction([
      prisma.candidateWallet.update({
        where: { walletId: wallet.walletId },
        data: { balance: { increment: depositAmount } },
      }),
      prisma.candidateTransaction.create({
        data: {
          amount: depositAmount,
          type: 'DEPOSIT',
          description: 'Bơm tiền giả lập cho môi trường TEST (100k)',
          walletId: wallet.walletId,
          candidateId,
          status: 'SUCCESS'
        },
      })
    ]);

    console.log("✅ FUNDS INJECTED SUCCESSFULLY!");
    console.log(`New Balance: ${updatedWallet.balance.toLocaleString('vi-VN')} VNĐ`);
    console.log(`Transaction Recorded: ID ${transaction.transactionId}`);

  } catch (error) {
    console.error("Script Failed:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

addFunds();
