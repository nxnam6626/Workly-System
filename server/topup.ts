import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres.jusrfiiboybrhaocqjdj:DuyTien2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
    }
  }
});

async function topup() {
  const email = 'nguyenduytien2905@gmail.com';
  const amount = 1000000;
  
  const user = await prisma.user.findUnique({
    where: { email },
    include: { recruiter: true }
  });

  if (!user || !user.recruiter) {
    console.error('User or Recruiter not found');
    return;
  }

  const wallet = await prisma.recruiterWallet.findUnique({
    where: { recruiterId: user.recruiter.recruiterId }
  });

  if (!wallet) {
    console.error('Wallet not found for recruiter');
    return;
  }

  const updatedWallet = await prisma.recruiterWallet.update({
    where: { walletId: wallet.walletId },
    data: { balance: { increment: amount } }
  });

  await prisma.transaction.create({
    data: {
      walletId: wallet.walletId,
      amount: amount,
      type: 'DEPOSIT',
      description: 'Được nạp trực tiếp qua hệ thống quản lý',
      status: 'SUCCESS'
    }
  });

  console.log(`Successfully added ${amount} credits to ${email}. New balance: ${updatedWallet.balance}`);
}

topup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
