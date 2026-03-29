import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Nạp .env ngay lập tức tại dòng đầu tiên
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('JobPostings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let companyId: string;
  let adminId: string;
  let recruiterId: string;
  let testJobId: string;

  const TEST_EMAILS = ['admin_e2e@test.com', 'recruiter_e2e@test.com'];

  // Hàm dọn dẹp dữ liệu theo thứ tự ưu tiên để tránh lỗi khóa ngoại
  const cleanup = async () => {
    // Thứ tự xóa: JobPosting -> Admin/Recruiter -> User -> Company

    // Xóa JobPosting liên quan đến các User test
    await prisma.jobPosting.deleteMany({
      where: {
        OR: [
          { recruiter: { user: { email: { in: TEST_EMAILS } } } },
          { admin: { user: { email: { in: TEST_EMAILS } } } },
        ],
      },
    });

    // Xóa Admin và Recruiter (Bảng con của User)
    await prisma.admin.deleteMany({
      where: { user: { email: { in: TEST_EMAILS } } },
    });
    await prisma.recruiter.deleteMany({
      where: { user: { email: { in: TEST_EMAILS } } },
    });

    // Xóa User (Bảng cha)
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });

    // Xóa Company test
    await prisma.company.deleteMany({
      where: { companyName: 'E2E Test Corp' },
    });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Dọn dẹp trước khi chạy để đảm bảo môi trường sạch
    await cleanup();

    // 2. Tạo dữ liệu mẫu cho bài Test
    const company = await prisma.company.create({
      data: { companyName: 'E2E Test Corp' },
    });
    companyId = company.companyId;

    const admin = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
        password: '123',
        role: 'ADMIN',
        status: 'ACTIVE',
        admin: { create: { adminLevel: 1 } },
      },
      include: { admin: true },
    });
    adminId = admin.admin!.adminId;

    const recruiter = await prisma.user.create({
      data: {
        email: TEST_EMAILS[1],
        password: '123',
        role: 'RECRUITER',
        status: 'ACTIVE',
        recruiter: { create: { bio: 'Test HR' } },
      },
      include: { recruiter: true },
    });
    recruiterId = recruiter.recruiter!.recruiterId;
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
      adminId,
      recruiterId,
    };

    const response = await request(app.getHttpServer())
      .post('/job-postings')
      .send(payload)
      .expect(201);

    expect(response.body).toHaveProperty('jobPostingId');
    testJobId = response.body.jobPostingId;

    expect(response.body.title).toBe(payload.title);
  });

  it('/job-postings (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/job-postings')
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/job-postings/:id (PATCH) - Success', async () => {
    return request(app.getHttpServer())
      .patch(`/job-postings/${testJobId}`)
      .send({ title: 'Updated Title' })
      .expect(200);
  });

  it('/job-postings/:id (DELETE) - Success', async () => {
    return request(app.getHttpServer())
      .delete(`/job-postings/${testJobId}`)
      .expect(200);
  });
});
