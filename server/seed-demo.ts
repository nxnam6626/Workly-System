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

  console.log('Starting seed...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Setup Roles
  const roles = ['ADMIN', 'CANDIDATE', 'RECRUITER'];
  for (const roleName of roles) {
    let role = await prisma.role.findUnique({ where: { roleName } });
    if (!role) {
      await prisma.role.create({ data: { roleName } });
    }
  }

  const getRoleId = async (roleName: string) => {
    return (await prisma.role.findUnique({ where: { roleName } }))!.roleId;
  };

  // 2. Setup ADMIN
  const adminEmail = 'admin@workly.vn';
  let adminUser = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    await prisma.userRole.create({
      data: { userId: adminUser.userId, roleId: await getRoleId('ADMIN') }
    });
    await prisma.admin.create({
      data: {
        userId: adminUser.userId,
        fullName: 'Admin Workly',
      }
    });
    console.log('Created Admin:', adminEmail);
  }

  // 3. Setup CANDIDATE
  const candidateEmail = 'candidate@workly.vn';
  let candidateUser = await prisma.user.findUnique({ where: { email: candidateEmail } });
  if (!candidateUser) {
    candidateUser = await prisma.user.create({
      data: {
        email: candidateEmail,
        password: passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    await prisma.userRole.create({
      data: { userId: candidateUser.userId, roleId: await getRoleId('CANDIDATE') }
    });
    await prisma.candidate.create({
      data: {
        userId: candidateUser.userId,
        fullName: 'Nguyễn Văn Ứng Viên',
        location: 'Hà Nội',
        isOpenToWork: true,
      }
    });
    console.log('Created Candidate:', candidateEmail);
  }

  // 4. Setup RECRUITER & COMPANY
  const recruiterEmail = 'recruiter@workly.vn';
  const taxCode = '0123456789-DEMO';
  
  let company = await prisma.company.findUnique({ where: { taxCode } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        companyName: 'Công ty Cổ phần DEMO Workly',
        taxCode: taxCode,
        isRegistered: true,
        verifyStatus: 1,
        address: 'Tòa nhà văn phòng DEMO, Quận Cầu Giấy, Hà Nội',
        description: 'Công ty chuyên cung cấp các giải pháp phần mềm và AI tại Việt Nam.',
      }
    });
    await prisma.companyWallet.create({
      data: {
        companyId: company.companyId,
        balance: 5000000,
        cvUnlockQuota: 50,
        cvUnlockQuotaMax: 50,
      }
    });
  }

  let recruiterUser = await prisma.user.findUnique({ where: { email: recruiterEmail } });
  if (!recruiterUser) {
    recruiterUser = await prisma.user.create({
      data: {
        email: recruiterEmail,
        password: passwordHash,
        status: 'ACTIVE',
        isEmailVerified: true,
      }
    });
    await prisma.userRole.create({
      data: { userId: recruiterUser.userId, roleId: await getRoleId('RECRUITER') }
    });
    let recruiter = await prisma.recruiter.create({
      data: {
        userId: recruiterUser.userId,
        companyId: company.companyId,
        fullName: 'Trần Thị Tuyển Dụng',
        position: 'HR Manager',
      }
    });
    console.log('Created Recruiter:', recruiterEmail);

    // Create 3 Jobs for this recruiter
    const jobsData = [
      {
        title: 'Senior Frontend Developer (ReactJS/NextJS)',
        description: '<p>Chúng tôi đang tìm kiếm Senior Frontend Developer tham gia vào dự án phát triển sản phẩm lõi của công ty.</p>',
        requirements: '<p>- Ít nhất 3 năm kinh nghiệm với ReactJS.<br/>- Am hiểu về NextJS, SSR, CSR.<br/>- Có kinh nghiệm tối ưu hiệu năng web.</p>',
        benefits: '<p>- Lương tháng 13, thưởng dự án.<br/>- Review lương 2 lần/năm.<br/>- Bảo hiểm sức khỏe cao cấp.</p>',
        salaryMin: 20000000,
        salaryMax: 40000000,
        currency: 'VND',
        jobType: 'FULLTIME' as const,
        locationCity: 'Hà Nội',
        status: 'APPROVED' as const,
        recruiterId: recruiter.recruiterId,
        companyId: company.companyId,
        jobTier: 'PROFESSIONAL' as const,
      },
      {
        title: 'Nhân viên Marketing Online',
        description: '<p>Cần tuyển chuyên viên Marketing phụ trách mảng Digital Marketing cho sản phẩm mới.</p>',
        requirements: '<p>- Tốt nghiệp đại học chuyên ngành Marketing hoặc liên quan.<br/>- Có kinh nghiệm chạy Ads (Facebook, Google).<br/>- Tư duy sáng tạo, khả năng viết lách tốt.</p>',
        benefits: '<p>- Môi trường làm việc trẻ trung, năng động.<br/>- Có phụ cấp ăn trưa, gửi xe.<br/>- Được đào tạo chuyên sâu về ngành.</p>',
        salaryMin: 10000000,
        salaryMax: 15000000,
        currency: 'VND',
        jobType: 'FULLTIME' as const,
        locationCity: 'Hà Nội',
        status: 'APPROVED' as const,
        recruiterId: recruiter.recruiterId,
        companyId: company.companyId,
        jobTier: 'BASIC' as const,
      },
      {
        title: 'Backend Node.js Developer (Middle)',
        description: '<p>Tham gia phát triển các API backend sử dụng Node.js, NestJS, làm việc với hệ thống Microservices.</p>',
        requirements: '<p>- Ít nhất 2 năm kinh nghiệm Node.js.<br/>- Đã từng làm việc với NestJS, PostgreSQL.<br/>- Hiểu biết về Redis, Kafka là lợi thế.</p>',
        benefits: '<p>- Cung cấp Macbook Pro để làm việc.<br/>- Trợ cấp thể thao, fitness.<br/>- Cơ hội thăng tiến lên Tech Lead.</p>',
        salaryMin: 15000000,
        salaryMax: 25000000,
        currency: 'VND',
        jobType: 'FULLTIME' as const,
        locationCity: 'Đà Nẵng',
        status: 'APPROVED' as const,
        recruiterId: recruiter.recruiterId,
        companyId: company.companyId,
        jobTier: 'BASIC' as const,
      }
    ];

    for (const job of jobsData) {
      await prisma.jobPosting.create({
        data: job
      });
    }
    console.log('Created 3 Job Postings.');
  } else {
    console.log('Recruiter already exists. Run clear first if you want fresh demo data.');
  }

  console.log('Seed completed successfully!');
}

main().catch(console.error).finally(() => process.exit(0));
