import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Candidates (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let candUserId: string;
  let candidateId: string;
  let candToken: string;
  let recruiterToken: string;

  const TEST_EMAILS = ['cand_e2e@test.com', 'rec_cand_e2e@test.com'];

  const cleanup = async () => {
    const users = await prisma.user.findMany({ where: { email: { in: TEST_EMAILS } } });
    if (!users.length) return;
    const userIds = users.map(u => u.userId);

    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.candidate.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.recruiter.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { email: { in: TEST_EMAILS } } });
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

    // Create Candidate
    const candUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
        password: '123',
        status: 'ACTIVE',
        candidate: { create: { fullName: 'Test Candidate E2E' } },
        userRoles: { create: { roleId: roleCand.roleId } }
      },
      include: { candidate: true },
    });
    candUserId = candUser.userId;
    candidateId = candUser.candidate!.candidateId;
    candToken = jwtService.sign({ sub: candUser.userId, email: candUser.email, roles: ['CANDIDATE'], type: 'access' }, { secret: process.env.JWT_ACCESS_SECRET || 'access-secret' });

    // Create Recruiter (To test saved candidates)
    const recUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[1],
        password: '123',
        status: 'ACTIVE',
        recruiter: { create: { bio: 'Test HR', savedCandidateIds: [] } },
        userRoles: { create: { roleId: roleRec.roleId } }
      },
      include: { recruiter: true }
    });
    recruiterToken = jwtService.sign({ sub: recUser.userId, email: recUser.email, roles: ['RECRUITER'], type: 'access' }, { secret: process.env.JWT_ACCESS_SECRET || 'access-secret' });
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
    await app.close();
  });

  it('/candidates (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/candidates')
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body.data)).toBe(true);
      });
  });

  it('/candidates/:id (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get(`/candidates/${candidateId}`)
      .expect(200)
      .then((res) => {
        expect(res.body.fullName).toBe('Test Candidate E2E');
      });
  });

  it('/candidates/:id/save (POST) - Success', async () => {
    return request(app.getHttpServer())
      .post(`/candidates/${candidateId}/save`)
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(201)
      .then((res) => {
        expect(res.body).toHaveProperty('saved');
        expect(res.body.candidateId).toBe(candidateId);
      });
  });

  it('/candidates/saved (GET) - Success', async () => {
    return request(app.getHttpServer())
      .get('/candidates/saved')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .expect(200)
      .then((res) => {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0].candidateId).toBe(candidateId);
      });
  });
});
