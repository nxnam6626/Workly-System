import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString, family: 4 } as any);
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const taxCode = '0101243150';
  const email = 'hrmisa@gmail.com';
  const passwordHash = await bcrypt.hash('123456', 10);

  let company = await prisma.company.findUnique({ where: { taxCode } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        companyName: 'MISA JSC',
        taxCode: taxCode,
        isRegistered: true,
        verifyStatus: 1,
      }
    });
    console.log('Created Company:', company.companyId);
  } else {
    console.log('Company exists:', company.companyId);
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: email,
        password: passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    console.log('Created User:', user.userId);
  } else {
    console.log('User exists:', user.userId);
  }

  let role = await prisma.role.findUnique({ where: { roleName: 'RECRUITER' } });
  if (!role) {
    role = await prisma.role.create({ data: { roleName: 'RECRUITER' } });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.userId, roleId: role.roleId } },
    create: { userId: user.userId, roleId: role.roleId },
    update: {}
  });

  let recruiter = await prisma.recruiter.findUnique({ where: { userId: user.userId } });
  if (!recruiter) {
    recruiter = await prisma.recruiter.create({
      data: {
        userId: user.userId,
        companyId: company.companyId,
        fullName: 'HR MISA',
      }
    });
    console.log('Created Recruiter:', recruiter.recruiterId);
  } else {
    console.log('Recruiter exists:', recruiter.recruiterId);
  }

  const wallet = await prisma.companyWallet.findUnique({ where: { companyId: company.companyId } });
  if (!wallet) {
    await prisma.companyWallet.create({
      data: {
        companyId: company.companyId,
        balance: 10000000,
        cvUnlockQuota: 100,
        cvUnlockQuotaMax: 100,
      }
    });
    console.log('Created Wallet');
  }

  console.log('DONE!');
}

main().catch(console.error).finally(() => process.exit(0));
