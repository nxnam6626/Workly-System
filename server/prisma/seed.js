const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL is not defined in .env');
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Trình khởi tạo dữ liệu mẫu đang bắt đầu...');

  const password = await bcrypt.hash('password123', 10);

  // 1. Create Roles
  const roles = ['CANDIDATE', 'RECRUITER', 'ADMIN'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { roleName },
      update: {},
      create: { roleName },
    });
  }

  const candidateRole = await prisma.role.findUnique({ where: { roleName: 'CANDIDATE' } });
  const recruiterRole = await prisma.role.findUnique({ where: { roleName: 'RECRUITER' } });
  const adminRole = await prisma.role.findUnique({ where: { roleName: 'ADMIN' } });

  console.log('✅ Đã khởi tạo các vai trò.');

  // 2. Create Candidate
  await prisma.user.upsert({
    where: { email: 'candidate@test.com' },
    update: {},
    create: {
      email: 'candidate@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: { roleId: candidateRole.roleId },
      },
      candidate: {
        create: {
          fullName: 'Nguyễn Văn Ứng Viên',
          university: 'PTIT',
          major: 'Software Engineering',
          gpa: 3.5,
          isOpenToWork: true,
        },
      },
    },
  });
  console.log('✅ Người tìm việc: candidate@test.com / password123');

  // 3. Create Recruiter
  const company = await prisma.company.upsert({
    where: { taxCode: '123456789' },
    update: {},
    create: {
      companyName: 'Workly Tech Solutions',
      taxCode: '123456789',
      address: 'Duy Tân, Hà Nội',
      isRegistered: true,
      verifyStatus: 1,
    },
  });

  await prisma.user.upsert({
    where: { email: 'recruiter@test.com' },
    update: {},
    create: {
      email: 'recruiter@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: [
          { roleId: recruiterRole.roleId },
          { roleId: candidateRole.roleId },
        ],
      },
      recruiter: {
        create: {
          companyId: company.companyId,
          position: 'HR Head',
        },
      },
      candidate: {
        create: {
          fullName: 'Recruiter Admin',
        },
      },
    },
  });
  console.log('✅ Nhà tuyển dụng: recruiter@test.com / password123');

  // 4. Create Admin
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: { roleId: adminRole.roleId },
      },
      admin: {
        create: {
          adminLevel: 1,
        },
      },
      candidate: {
        create: {
          fullName: 'System Admin',
        },
      },
    },
  });
  console.log('✅ Quản trị viên: admin@test.com / password123');

  // 5. Create Sample Job Postings
  const jobPostings = [
    {
      title: 'Software Engineer (Java/Spring Boot)',
      description: 'We are looking for a Senior Software Engineer with strong experience in Java and Spring Boot. Job involves building high-scale microservices.',
      locationCity: 'Hà Nội',
      jobType: 'FULLTIME',
      status: 'APPROVED',
      salaryMin: 2000,
      salaryMax: 4000,
      originalUrl: 'https://example.com/job1',
    },
    {
      title: 'Kỹ sư phần mềm (Next.js/Node.js)',
      description: 'Tuyển dụng Kỹ sư phần mềm am hiểu React, Next.js và Node.js. Tham gia phát triển các dự án E-commerce hiện đại.',
      locationCity: 'Hồ Chí Minh',
      jobType: 'FULLTIME',
      status: 'APPROVED',
      salaryMin: 1500,
      salaryMax: 3000,
      originalUrl: 'https://example.com/job2',
    },
    {
      title: 'UI/UX Designer',
      description: 'Làm việc cùng đội ngũ Product để thiết kế giao diện người dùng thân thiện. Sử dụng Figma, Adobe XD.',
      locationCity: 'Đà Nẵng',
      jobType: 'PARTTIME',
      status: 'APPROVED',
      salaryMin: 800,
      salaryMax: 1500,
      originalUrl: 'https://example.com/job3',
    },
    {
      title: 'Chuyên viên Nhân sự (HR Generalist)',
      description: 'Quản lý quy trình tuyển dụng, đào tạo và phúc lợi cho nhân viên. Cần có kỹ năng giao tiếp tốt.',
      locationCity: 'Hà Nội',
      jobType: 'FULLTIME',
      status: 'APPROVED',
      salaryMin: 1000,
      salaryMax: 2000,
      originalUrl: 'https://example.com/job4',
    }
  ];

  for (const job of jobPostings) {
    await prisma.jobPosting.create({
      data: {
        ...job,
        companyId: company.companyId,
      }
    });
  }
  console.log('✅ Đã tạo 4 tin tuyển dụng mẫu (APPROVED).');

  console.log('🚀 Đã hoàn tất khởi tạo dữ liệu mẫu!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
