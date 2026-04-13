import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Companies (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let recruiterToken: string;
  let recUserId: string;
  let companyId: string;
  let testCompanyName: string;

  const TEST_EMAILS = ['rec_comp_e2e@test.com'];

  const cleanup = async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: TEST_EMAILS } },
    });
    if (!users.length) return;
    const userIds = users.map((u) => u.userId);

    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.recruiter.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
    await prisma.company.deleteMany({
      where: { companyName: { startsWith: 'Company E2E Corp' } },
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
    jwtService = app.get<JwtService>(JwtService);

    await cleanup();

    const roleRec = await prisma.role.upsert({
      where: { roleName: 'RECRUITER' },
      update: {},
      create: { roleName: 'RECRUITER' },
    });

    const taxCode = 'TAX-E2E-' + Date.now();
    testCompanyName = 'Company E2E Corp ' + Date.now();
    const company = await prisma.company.create({
      data: {
        companyName: testCompanyName,
        address: 'Hanoi',
        description: 'Testing Company',
        taxCode: taxCode,
      },
    });
    companyId = company.companyId;

    const recUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
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
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
    await app.close();
  });

  it('/companies (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/companies')
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body.items)).toBe(true);
      });
  });

  it('/companies/:id (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get(`/companies/${companyId}`)
      .expect(200)
      .then((res) => {
        expect(res.body.companyName).toBe(testCompanyName);
      });
  });

  it('/companies/my-company (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get(`/companies/my-company`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200)
      .then((res) => {
        expect(res.body.companyId).toBe(companyId);
        expect(res.body.companyName).toBe(testCompanyName);
      });
  });

  it('/companies/my-company (PATCH) - Success', async () => {
    return request(app.getHttpServer())
      .patch(`/companies/my-company`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({ companyName: 'Company E2E Corp Updated', companySize: 100 })
      .expect(200)
      .then((res) => {
        expect(res.body.companyName).toBe('Company E2E Corp Updated');
        expect(res.body.companySize).toBe(100);
      });
  });
});
