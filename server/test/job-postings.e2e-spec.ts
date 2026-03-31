import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Nạp .env ngay lập tức tại dòng đầu tiên
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('JobPostings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let companyId: string;
  let adminId: string;
  let recruiterId: string;
  let testJobId: string;
  let recruiterToken: string;
  let jwtService: JwtService;

  const TEST_EMAILS = ['admin_e2e@test.com', 'recruiter_e2e@test.com'];

  // Hàm dọn dẹp dữ liệu theo thứ tự ưu tiên để tránh lỗi khóa ngoại
  const cleanup = async () => {
    const users = await prisma.user.findMany({ where: { email: { in: TEST_EMAILS } } });
    if (!users.length) return;
    const userIds = users.map(u => u.userId);

    // Xóa JobPosting
    await prisma.jobPosting.deleteMany({
      where: { recruiter: { userId: { in: userIds } } }
    });

    // Xóa UserRoles
    await prisma.userRole.deleteMany({
      where: { userId: { in: userIds } }
    });

    // Xóa Admin và Recruiter
    await prisma.admin.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.recruiter.deleteMany({ where: { userId: { in: userIds } } });

    // Xóa User
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });

    // Xóa Company
    await prisma.company.deleteMany({ where: { companyName: 'E2E Test Corp' } });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Dọn dẹp trước khi chạy để đảm bảo môi trường sạch
    await cleanup();

    // 2. Tạo dữ liệu mẫu cho bài Test
    const company = await prisma.company.create({
      data: { companyName: 'E2E Test Corp' },
    });
    companyId = company.companyId;

    // Create Base Roles if not exist
    const roleRec = await prisma.role.upsert({
      where: { roleName: 'RECRUITER' },
      update: {},
      create: { roleName: 'RECRUITER' },
    });
    const roleAdmin = await prisma.role.upsert({
      where: { roleName: 'ADMIN' },
      update: {},
      create: { roleName: 'ADMIN' },
    });

    const admin = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
        password: '123',
        status: 'ACTIVE',
        admin: { create: { adminLevel: 1 } },
        userRoles: { create: { roleId: roleAdmin.roleId } }
      },
      include: { admin: true },
    });
    adminId = admin.admin!.adminId;

    const recruiter = await prisma.user.create({
      data: {
        email: TEST_EMAILS[1],
        password: '123',
        status: 'ACTIVE',
        recruiter: { create: { bio: 'Test HR', companyId: companyId } },
        userRoles: { create: { roleId: roleRec.roleId } }
      },
      include: { recruiter: true },
    });
    recruiterId = recruiter.recruiter!.recruiterId;

    recruiterToken = jwtService.sign({ sub: recruiter.userId, email: recruiter.email, roles: ['RECRUITER'], type: 'access' }, { secret: process.env.JWT_ACCESS_SECRET || 'access-secret' });
  });

  afterAll(async () => {
    await cleanup(); // Dọn dẹp sau khi kết thúc
    await prisma.$disconnect();
    await app.close();
  });

  // --- CÁC TEST CASE ---

  it('/job-postings (POST) - Success', async () => {
    const payload = {
      title: 'QA Automation Engineer',
      description: 'Test hệ thống Workly AI',
      salaryMin: 15000000,
      salaryMax: 25000000,
      locationCity: 'Hồ Chí Minh',
      companyId,
      recruiterId,
      originalUrl: 'https://test-job-' + Date.now() + '.com',
    };

    const response = await request(app.getHttpServer())
      .post('/job-postings')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send(payload);
    
    console.log('POST /job-postings response:', response.body);
    
    expect(response.status).toBe(201);

    expect(response.body).toHaveProperty('jobPostingId');
    testJobId = response.body.jobPostingId;

    expect(response.body.title).toBe(payload.title);
  });

  it('/job-postings (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/job-postings')
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
      });
  });

  it('/job-postings/:id (PATCH) - Success', async () => {
    return request(app.getHttpServer())
      .patch(`/job-postings/${testJobId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);
  });

  it('/job-postings/:id (DELETE) - Success', async () => {
    return request(app.getHttpServer())
      .delete(`/job-postings/${testJobId}`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200);
  });
});
