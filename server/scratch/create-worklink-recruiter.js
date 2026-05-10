const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const NEW_EMAIL = "worklink_hr@workly.vn";
const RAW_PASSWORD = "Password@123"; // Highly visible for testing

async function main() {
  console.log(`--- ATTEMPTING TO CREATE RECRUITER FOR WORKLINK ---`);
  
  const company = await prisma.company.findFirst({
      where: { companyName: { contains: "Worklink" } }
  });

  if (!company) {
      console.error("CRITICAL ERROR: Worklink Company NOT found! Seed it first.");
      return;
  }

  console.log(`Found Target Company: ${company.companyName} (ID: ${company.companyId})`);

  const hashedPassword = await bcrypt.hash(RAW_PASSWORD, 10);

  const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.upsert({
          where: { email: NEW_EMAIL },
          update: { password: hashedPassword },
          create: {
              email: NEW_EMAIL,
              password: hashedPassword,
              status: 'ACTIVE'
          }
      });

      // 2. Ensure Role exists and connect it
      const roleRecord = await tx.role.upsert({
          where: { roleName: 'RECRUITER' },
          update: {},
          create: { roleName: 'RECRUITER' }
      });

      await tx.userRole.upsert({
          where: { 
              userId_roleId: { 
                  userId: user.userId, 
                  roleId: roleRecord.roleId 
              } 
          },
          update: {},
          create: {
              userId: user.userId,
              roleId: roleRecord.roleId
          }
      });

      // 3. Create Recruiter object attached to company
      await tx.recruiter.upsert({
          where: { userId: user.userId },
          update: { companyId: company.companyId },
          create: {
              userId: user.userId,
              fullName: "Quản lý Nhân sự Worklink",
              companyRole: 'MASTER',
              companyId: company.companyId
          }
      });

      // 4. Check/Create Wallet
      await tx.companyWallet.upsert({
          where: { companyId: company.companyId },
          update: {},
          create: {
              companyId: company.companyId,
              balance: 1000000 // Give some start credit
          }
      });

      return user;
  });

  console.log(`\n✅ SUCCESS: Created/Updated Recruiter User!`);
  console.log(`📧 Account Email: ${NEW_EMAIL}`);
  console.log(`🔑 Password     : ${RAW_PASSWORD}`);
  console.log(`🏢 Managed Co   : ${company.companyName}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
