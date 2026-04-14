import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
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

  // 2. Create Candidate
  const candidateUser = await prisma.user.upsert({
    where: { email: 'candidate@test.com' },
    update: {},
    create: {
      email: 'candidate@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: { roleId: candidateRole!.roleId },
      },
      candidate: {
        create: {
          fullName: 'Nguyễn Văn Ứng Viên',
          university: 'Học viện Công nghệ Bưu chính Viễn thông',
          major: 'Công nghệ thông tin',
          gpa: 3.5,
          isOpenToWork: true,
        },
      },
    },
  });
  console.log('✅ Candidate created: candidate@test.com / password123');

  // 3. Create Recruiter & Company
  const testCompany = await prisma.company.upsert({
    where: { taxCode: '123456789' },
    update: {},
    create: {
      companyName: 'Công ty Công nghệ Workly',
      taxCode: '123456789',
      address: 'Duy Tân, Cầu Giấy, Hà Nội',
      description: 'Công ty hàng đầu về giải pháp tuyển dụng AI.',
      isRegistered: true,
      verifyStatus: 1,
    },
  });

  const recruiterUser = await prisma.user.upsert({
    where: { email: 'recruiter@test.com' },
    update: {},
    create: {
      email: 'recruiter@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: [
          { roleId: recruiterRole!.roleId },
          { roleId: candidateRole!.roleId }, // Every user is also a candidate in this system
        ],
      },
      recruiter: {
        create: {
          bio: 'Trưởng phòng nhân sự tại Workly',
          position: 'HR Manager',
          companyId: testCompany.companyId,
        },
      },
      candidate: {
        create: {
          fullName: 'Lê HR',
        },
      },
    },
  });
  console.log('✅ Recruiter created: recruiter@test.com / password123');

  // 4. Create Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      password,
      status: 'ACTIVE',
      userRoles: {
        create: { roleId: adminRole!.roleId },
      },
      admin: {
        create: {
          adminLevel: 1,
        },
      },
      candidate: {
        create: {
          fullName: 'Hệ thống Quản trị',
        },
      },
    },
  });
  console.log('✅ Admin created: admin@test.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
