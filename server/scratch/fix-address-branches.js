const { PrismaClient } = require('../dist/src/generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const TARGET_TAX_CODE = '0318473689';
const CORRECT_ADDRESS = '217/23 Nguyễn Gia Trí, Phường Thạnh Mỹ Tây, TP Hồ Chí Minh';

async function main() {
  console.log('🔍 Looking up Company with Tax Code:', TARGET_TAX_CODE);
  const company = await prisma.company.findFirst({
    where: { taxCode: TARGET_TAX_CODE },
    include: { branches: true }
  });

  if (!company) {
    console.error('❌ Company not found!');
    process.exit(1);
  }

  console.log('Found Company:', company.companyName);
  console.log('Current System Address:', company.address);
  console.log('Active Branches Found:', company.branches.length);

  await prisma.$transaction(async (tx) => {
    // 1. Update main company address just in case
    await tx.company.update({
      where: { companyId: company.companyId },
      data: { address: CORRECT_ADDRESS }
    });
    console.log('✅ System Address Updated in Master Table.');

    // 2. Wipe old branches for consistent state
    if (company.branches.length > 0) {
        await tx.companyBranch.deleteMany({
           where: { companyId: company.companyId }
        });
        console.log('🗑️  Cleared old branch locations.');
    }

    // 3. Re-create verified single Headquarters
    await tx.companyBranch.create({
        data: {
            companyId: company.companyId,
            name: 'Trụ sở chính',
            address: CORRECT_ADDRESS,
            isVerified: false // System geocoder handles verification on next access/edit
        }
    });
    console.log('✨ Injected fresh canonical Headquarters branch row.');
  });

  console.log('🎉 DATA RECOVERY COMPLETE.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
