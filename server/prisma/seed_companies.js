const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('password123', 10);
  
  const recruiterRole = await prisma.role.upsert({
    where: { roleName: 'RECRUITER' },
    update: {},
    create: { roleName: 'RECRUITER' },
  });

  const companiesData = [
    { name: 'Tech Vina Corp', address: 'Tòa nhà Bitexco, Quận 1, TP.HCM' },
    { name: 'Global Software Group', address: 'Khu công nghệ cao Hòa Lạc, Hà Nội' },
    { name: 'Đà Nẵng IT Solutions', address: 'Đường Bạch Đằng, Hải Châu, Đà Nẵng' },
    { name: 'Mekong Tech', address: 'Quận Ninh Kiều, Cần Thơ' },
    { name: 'Alpha Finance', address: 'Landmark 81, Bình Thạnh, TP.HCM' },
    { name: 'E-commerce Viet', address: 'Quận Cầu Giấy, Hà Nội' },
    { name: 'NextGen AI', address: 'Quận 7, TP.HCM' },
    { name: 'Blue Ocean Shipping', address: 'Ngô Quyền, Hải Phòng' },
    { name: 'Green Builders', address: 'Bình Dương' },
    { name: 'Healthcare Plus', address: 'Quận 10, TP.HCM' }
  ];

  for (let i = 0; i < companiesData.length; i++) {
    const compInfo = companiesData[i];
    const email = `recruiter_bulk${i + 1}@test.com`;

    // 1. Create User
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password,
        status: 'ACTIVE',
        userRoles: {
          create: { roleId: recruiterRole.roleId },
        }
      }
    });

    // 2. Create Company
    const company = await prisma.company.create({
      data: {
        companyName: compInfo.name,
        address: compInfo.address,
        isRegistered: true,
        verifyStatus: 1, // Verified
        description: `Công ty ${compInfo.name} hàng đầu trong lĩnh vực của mình.`,
        branches: {
          create: [{
            name: 'Trụ sở chính',
            address: compInfo.address,
            isVerified: true
          }]
        }
      }
    });

    // 3. Create Recruiter associated with User and Company
    await prisma.recruiter.upsert({
      where: { userId: user.userId },
      update: { companyId: company.companyId },
      create: {
        userId: user.userId,
        fullName: `HR ${compInfo.name}`,
        companyId: company.companyId,
        companyRole: 'MASTER',
      }
    });

    console.log(`Created Company: ${compInfo.name} | Recruiter: ${email} | HQ: ${compInfo.address}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
