import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { JobStatus, JobTier, JobType, StatusUser } from './generated/prisma';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);

  console.log('--- BẮT ĐẦU SEED DỮ LIỆU TEST FILTER ---');

  const password = await bcrypt.hash('password123', 10);

  const testEmails = [
    'tech_hr@workly.com',
    'agency_hr@workly.com',
    'finance_hr@workly.com',
    'logistics_hr@workly.com',
    'hotel_hr@workly.com',
    'sale_hr@workly.com'
  ];

  const testCompanyNames = [
    'Global Tech Solutions',
    'Creative Agency X',
    'Finance & Growth Corp',
    'Green Logistics',
    'Luxury Hotel & Spa',
    'Sale Plus'
  ];

  console.log('--- ĐANG DỌN DẸP DỮ LIỆU TEST CŨ ---');
  try {
    await prisma.jobMatch.deleteMany({ where: { jobPosting: { company: { companyName: { in: testCompanyNames } } } } });
    await prisma.savedJob.deleteMany({ where: { jobPosting: { company: { companyName: { in: testCompanyNames } } } } });
    await prisma.application.deleteMany({ where: { jobPosting: { company: { companyName: { in: testCompanyNames } } } } });
    await prisma.jobPosting.deleteMany({ where: { company: { companyName: { in: testCompanyNames } } } });
    await prisma.companyBranch.deleteMany({ where: { company: { companyName: { in: testCompanyNames } } } });
    await prisma.recruiter.deleteMany({ where: { user: { email: { in: testEmails } } } });
    await prisma.company.deleteMany({ where: { companyName: { in: testCompanyNames } } });
    // Keep users but update them if needed, or delete if no relations left
    console.log('✅ Đã dọn dẹp dữ liệu Jobs/Companies thành công.');
  } catch (err) {
    console.warn('⚠️ Lỗi khi dọn dẹp:', err.message);
  }

  const roleRecruiter = await prisma.role.findUnique({ where: { roleName: 'RECRUITER' } });

  const testCompanies = [
    {
      name: 'Global Tech Solutions',
      email: 'tech_hr@workly.com',
      industry: 'Công Nghệ Thông Tin',
      location: 'Hà Nội',
      jobs: [
        { title: 'Senior Backend Developer (Node.js)', type: JobType.FULLTIME, salaryMin: 30000000, salaryMax: 50000000, exp: '3-5 năm', city: 'Hà Nội', cat: ['Công Nghệ Thông Tin', 'Backend'] },
        { title: 'Junior Frontend Developer (React)', type: JobType.FULLTIME, salaryMin: 12000000, salaryMax: 18000000, exp: '1-2 năm', city: 'Hà Nội', cat: ['Công Nghệ Thông Tin', 'Frontend'] },
        { title: 'DevOps Engineer', type: JobType.FULLTIME, salaryMin: 40000000, salaryMax: 70000000, exp: 'Trên 5 năm', city: 'Hà Nội', cat: ['Công Nghệ Thông Tin', 'DevOps/Cloud'] },
      ]
    },
    {
      name: 'Creative Agency X',
      email: 'agency_hr@workly.com',
      industry: 'Marketing/PR/Quảng Cáo',
      location: 'TP. Hồ Chí Minh',
      jobs: [
        { title: 'Content Creator', type: JobType.FULLTIME, salaryMin: 10000000, salaryMax: 15000000, exp: '1 năm', city: 'TP. Hồ Chí Minh', cat: ['Marketing/PR/Quảng Cáo', 'Sáng Tạo Nội Dung'] },
        { title: 'Digital Marketing Manager', type: JobType.FULLTIME, salaryMin: 25000000, salaryMax: 40000000, exp: '3 năm', city: 'TP. Hồ Chí Minh', cat: ['Marketing/PR/Quảng Cáo', 'Digital Marketing'] },
        { title: 'Marketing Intern', type: JobType.REMOTE, salaryMin: 3000000, salaryMax: 5000000, exp: 'Không yêu cầu', city: 'TP. Hồ Chí Minh', cat: ['Marketing/PR/Quảng Cáo'] },
      ]
    },
    {
      name: 'Finance & Growth Corp',
      email: 'finance_hr@workly.com',
      industry: 'Tài Chính/Ngân Hàng',
      location: 'Đà Nẵng',
      jobs: [
        { title: 'Chuyên viên Tư vấn Tài chính', type: JobType.FULLTIME, salaryMin: 15000000, salaryMax: 30000000, exp: '2 năm', city: 'Đà Nẵng', cat: ['Tài Chính/Ngân Hàng', 'Tư Vấn Tài Chính'] },
        { title: 'Kế toán tổng hợp', type: JobType.FULLTIME, salaryMin: 12000000, salaryMax: 20000000, exp: '2-3 năm', city: 'Đà Nẵng', cat: ['Tài Chính/Ngân Hàng', 'Kế Toán / Kiểm Toán'] },
      ]
    },
    {
      name: 'Green Logistics',
      email: 'logistics_hr@workly.com',
      industry: 'Vận Tải/Kho Bãi',
      location: 'Hải Phòng',
      jobs: [
        { title: 'Nhân viên Xuất nhập khẩu', type: JobType.FULLTIME, salaryMin: 10000000, salaryMax: 15000000, exp: '1-2 năm', city: 'Hải Phòng', cat: ['Vận Tải/Kho Bãi', 'Xuất Nhập Khẩu'] },
        { title: 'Quản lý Kho vận', type: JobType.FULLTIME, salaryMin: 20000000, salaryMax: 30000000, exp: '5 năm', city: 'Hải Phòng', cat: ['Vận Tải/Kho Bãi', 'Quản Lý Kho Bãi'] },
      ]
    },
    {
      name: 'Luxury Hotel & Spa',
      email: 'hotel_hr@workly.com',
      industry: 'Du Lịch/Khách Sạn',
      location: 'Phú Quốc',
      jobs: [
        { title: 'Lễ tân Khách sạn', type: JobType.FULLTIME, salaryMin: 7000000, salaryMax: 10000000, exp: 'Không yêu cầu', city: 'Kiên Giang', cat: ['Du Lịch/Khách Sạn', 'Lễ Tân / Phục Vụ'] },
        { title: 'Bếp trưởng', type: JobType.FULLTIME, salaryMin: 30000000, salaryMax: 50000000, exp: 'Trên 5 năm', city: 'Kiên Giang', cat: ['Du Lịch/Khách Sạn', 'Đầu Bếp / Bếp Trưởng'] },
      ]
    },
    {
      name: 'Sale Plus',
      email: 'sale_hr@workly.com',
      industry: 'Kinh Doanh/Bán Hàng',
      location: 'Hà Nội',
      jobs: [
        { title: 'Nhân viên Telesales', type: JobType.PARTTIME, salaryMin: 5000000, salaryMax: 8000000, exp: 'Không yêu cầu', city: 'Hà Nội', cat: ['Kinh Doanh/Bán Hàng', 'Telesales - Bán Hàng Online'] },
        { title: 'Trưởng phòng Kinh doanh', type: JobType.FULLTIME, salaryMin: 40000000, salaryMax: 60000000, exp: '5 năm', city: 'Hà Nội', cat: ['Kinh Doanh/Bán Hàng', 'Phát Triển Kinh Doanh'] },
      ]
    }
  ];

  for (const cData of testCompanies) {
    const user = await prisma.user.upsert({
      where: { email: cData.email },
      update: { status: StatusUser.ACTIVE },
      create: {
        email: cData.email,
        password,
        status: StatusUser.ACTIVE,
        userRoles: {
          create: {
            roleId: roleRecruiter!.roleId
          }
        }
      },
    });

    const company = await prisma.company.create({
      data: {
        companyName: cData.name,
        taxCode: Math.random().toString().slice(2, 12),
        mainIndustry: cData.industry,
        description: `Môi trường làm việc năng động tại ${cData.name}`,
        websiteUrl: `https://${cData.name.toLowerCase().replace(/ /g, '')}.com`,
      },
    });

    const recruiter = await prisma.recruiter.create({
      data: {
        userId: user.userId,
        companyId: company.companyId,
      },
    });

    const branch = await prisma.companyBranch.create({
      data: {
        companyId: company.companyId,
        name: `Trụ sở ${cData.location}`,
        address: `Số 1 ${cData.location}`,
      }
    });

    for (const j of cData.jobs) {
      await prisma.jobPosting.create({
        data: {
          title: j.title,
          description: `Mô tả công việc cho vị trí ${j.title} tại ${cData.name}.`,
          requirements: `Yêu cầu cho vị trí ${j.title}.`,
          benefits: 'Lương thưởng hấp dẫn, bảo hiểm đầy đủ.',
          salaryMin: j.salaryMin,
          salaryMax: j.salaryMax,
          jobType: j.type,
          experience: j.exp,
          vacancies: 1,
          recruiterId: recruiter.recruiterId,
          companyId: company.companyId,
          status: JobStatus.APPROVED,
          jobTier: JobTier.BASIC,
          isVerified: true,
          locationCity: j.city || cData.location,
          branches: { create: { branchId: branch.branchId } },
          structuredRequirements: {
            categories: j.cat,
            hardSkills: [j.cat[0], j.title],
            softSkills: ['Communication', 'Teamwork'],
            minExperienceYears: parseInt(j.exp) || 0
          }
        }
      });
    }
  }

  console.log('✅ Đã seed dữ liệu test filter thành công!');
  await app.close();
}

bootstrap();
