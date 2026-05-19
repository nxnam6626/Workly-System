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

  const email = 'tondz2905@gmail.com';
  const amountToTopUp = 100000;

  console.log(`Đang tìm tài khoản ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      candidate: { include: { wallet: true } },
      recruiter: { include: { company: { include: { wallet: true } } } },
    }
  });

  if (!user) {
    console.error(`Không tìm thấy tài khoản với email: ${email}`);
    process.exit(1);
  }

  if (user.recruiter && user.recruiter.company) {
    // Tài khoản nhà tuyển dụng -> cộng tiền vào ví công ty
    let wallet = user.recruiter.company.wallet;
    if (!wallet) {
      wallet = await prisma.companyWallet.create({
        data: {
          companyId: user.recruiter.companyId!,
          balance: amountToTopUp,
          cvUnlockQuota: 0,
          cvUnlockQuotaMax: 0,
        }
      });
      console.log(`Đã tạo ví công ty mới và nạp ${amountToTopUp} VNĐ.`);
    } else {
      wallet = await prisma.companyWallet.update({
        where: { walletId: wallet.walletId },
        data: {
          balance: wallet.balance + amountToTopUp,
        }
      });
      console.log(`Đã nạp thêm ${amountToTopUp} VNĐ. Số dư mới của ví công ty: ${wallet.balance} VNĐ`);
    }

    // Tạo lịch sử giao dịch
    await prisma.transaction.create({
      data: {
        walletId: wallet.walletId,
        amount: amountToTopUp,
        realMoney: amountToTopUp,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        description: 'Admin nạp tiền thủ công',
        recruiterId: user.recruiter.recruiterId,
        orderCode: Math.floor(Date.now() / 1000), // order code random
      }
    });

  } else if (user.candidate) {
    // Tài khoản ứng viên
    let wallet = user.candidate.wallet;
    if (!wallet) {
      wallet = await prisma.candidateWallet.create({
        data: {
          candidateId: user.candidate.candidateId,
          balance: amountToTopUp,
        }
      });
      console.log(`Đã tạo ví ứng viên mới và nạp ${amountToTopUp} VNĐ.`);
    } else {
      wallet = await prisma.candidateWallet.update({
        where: { walletId: wallet.walletId },
        data: {
          balance: wallet.balance + amountToTopUp,
        }
      });
      console.log(`Đã nạp thêm ${amountToTopUp} VNĐ. Số dư mới của ví ứng viên: ${wallet.balance} VNĐ`);
    }

    // Tạo lịch sử giao dịch
    await prisma.candidateTransaction.create({
      data: {
        walletId: wallet.walletId,
        amount: amountToTopUp,
        realMoney: amountToTopUp,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        description: 'Admin nạp tiền thủ công',
        candidateId: user.candidate.candidateId,
        orderCode: Math.floor(Date.now() / 1000), // order code random
      }
    });
  } else {
    console.error('Tài khoản này không phải là Ứng viên cũng không phải Nhà tuyển dụng.');
    process.exit(1);
  }

  console.log('Nạp tiền thành công!');
}

main().catch(console.error).finally(() => process.exit(0));
