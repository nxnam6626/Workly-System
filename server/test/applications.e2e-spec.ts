import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let candToken: string;
  let recruiterToken: string;
  let candUserId: string;
  let recUserId: string;
  let companyId: string;
  let testJobId: string;
  let cvId: string;
  let applicationId: string;

  const TEST_EMAILS = ['cand_app_e2e@test.com', 'rec_app_e2e@test.com'];

  const cleanup = async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: TEST_EMAILS } },
    });
    if (!users.length) return;
    const userIds = users.map((u) => u.userId);

    // Xóa Applications
    await prisma.application.deleteMany({
      where: { candidate: { userId: { in: userIds } } },
    });

    // Xóa CV
    await prisma.cV.deleteMany({
      where: { candidate: { userId: { in: userIds } } },
    });

    // Xóa JobPosting
    await prisma.jobPosting.deleteMany({
      where: { recruiter: { userId: { in: userIds } } },
    });

    // Xóa UserRoles
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });

    // Xóa Admin/Candidate/Recruiter
    await prisma.candidate.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.recruiter.deleteMany({ where: { userId: { in: userIds } } });

    // Xóa User
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });

    // Xóa Company
    await prisma.company.deleteMany({ where: { companyName: 'App E2E Corp' } });
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

    await cleanup();

    const roleCand = await prisma.role.upsert({
      where: { roleName: 'CANDIDATE' },
      update: {},
      create: { roleName: 'CANDIDATE' },
    });
    const roleRec = await prisma.role.upsert({
      where: { roleName: 'RECRUITER' },
      update: {},
      create: { roleName: 'RECRUITER' },
    });

    const company = await prisma.company.create({
      data: { companyName: 'App E2E Corp' },
    });
    companyId = company.companyId;

    const candUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
        password: '123',
        status: 'ACTIVE',
        candidate: { create: { fullName: 'Test Cand App E2E' } },
        userRoles: { create: { roleId: roleCand.roleId } },
      },
      include: { candidate: true },
    });
    candUserId = candUser.userId;
    candToken = jwtService.sign({
      sub: candUser.userId,
      email: candUser.email,
      roles: ['CANDIDATE'],
      type: 'access',
    });

    const cv = await prisma.cV.create({
      data: {
        cvTitle: 'My CV',
        fileUrl: '/uploads/cvs/test.pdf',
        candidateId: candUser.candidate!.candidateId,
      },
    });
    cvId = cv.cvId;

    const recUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[1],
        password: '123',
        status: 'ACTIVE',
        recruiter: { create: { bio: 'Test HR', companyId } },
        userRoles: { create: { roleId: roleRec.roleId } },
      },
      include: { recruiter: true },
    });
    recUserId = recUser.userId;
    recruiterToken = jwtService.sign(
      {
        sub: recUser.userId,
        email: recUser.email,
        roles: ['RECRUITER'],
        type: 'access',
      },
      { secret: process.env.JWT_ACCESS_SECRET || 'access-secret' },
    );

    const job = await prisma.jobPosting.create({
      data: {
        title: 'App Test Job',
        companyId,
        recruiterId: recUser.recruiter!.recruiterId,
        postType: 'MANUAL',
        originalUrl: 'app-e2e-' + Date.now(),
        status: 'APPROVED',
      },
    });
    testJobId = job.jobPostingId;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
    await app.close();
  });

  // Chú ý: API tạo application dùng UploadedFile, fake FormData trong e2e phức tạp, chúng ta sẽ test tạo bằng DB và test các API GET/PATCH
  beforeAll(async () => {
    const candidate = await prisma.candidate.findUnique({
      where: { userId: candUserId },
    });
    const application = await prisma.application.create({
      data: {
        jobPostingId: testJobId,
        candidateId: candidate!.candidateId,
        cvId: cvId,
        cvSnapshotUrl: '/uploads/cvs/test.pdf',
        coverLetter: 'Hello HR',
        appStatus: 'PENDING',
      },
    });
    applicationId = application.applicationId;
  });

  it('/applications/me (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/applications/me')
      .set('Authorization', `Bearer ${candToken}`)
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/applications/job/:id (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get(`/applications/job/${testJobId}`)
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('/applications/recruiter (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/applications/recruiter')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
      });
  });

  it('/applications/:id/status (PATCH) - Success', async () => {
    return request(app.getHttpServer())
      .patch(`/applications/${applicationId}/status`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ status: 'REVIEWED' })
      .expect(200)
      .then((res) => {
        expect(res.body.appStatus).toBe('REVIEWED');
      });
  });
});
