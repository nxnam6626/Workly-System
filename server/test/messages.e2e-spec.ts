import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Messages (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let recruiterUserId: string;
  let candidate1UserId: string;
  let candidate2UserId: string;
  let recruiterToken: string;
  let candidate1Token: string;
  let conversationId: string;

  const TEST_EMAILS = [
    'rec_msg@test.com',
    'cand1_msg@test.com',
    'cand2_msg@test.com',
  ];

  const cleanup = async () => {
    const users = await prisma.user.findMany({
      where: { email: { in: TEST_EMAILS } },
    });
    if (!users.length) return;
    const userIds = users.map((u) => u.userId);

    // Xóa Messages
    await prisma.message.deleteMany({
      where: { senderId: { in: userIds } },
    });

    // Tìm và xóa Conversations
    const recruiters = await prisma.recruiter.findMany({
      where: { userId: { in: userIds } },
    });
    const candidates = await prisma.candidate.findMany({
      where: { userId: { in: userIds } },
    });

    if (recruiters.length > 0 || candidates.length > 0) {
      await prisma.conversation.deleteMany({
        where: {
          OR: [
            ...recruiters.map((r) => ({ recruiterId: r.recruiterId })),
            ...candidates.map((c) => ({ candidateId: c.candidateId })),
          ],
        },
      });
    }

    // Xóa Recruiter/Candidate & Users
    await prisma.recruiter.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.candidate.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
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

    // Create Base Roles if not exist
    const roleRec = await prisma.role.upsert({
      where: { roleName: 'RECRUITER' },
      update: {},
      create: { roleName: 'RECRUITER' },
    });
    const roleCand = await prisma.role.upsert({
      where: { roleName: 'CANDIDATE' },
      update: {},
      create: { roleName: 'CANDIDATE' },
    });

    // Create Recruiter
    const recUser = await prisma.user.create({
      data: {
        email: TEST_EMAILS[0],
        password: '123',
        status: 'ACTIVE',
        recruiter: { create: { bio: 'Test HR' } },
        userRoles: { create: { roleId: roleRec.roleId } },
      },
      include: { recruiter: true },
    });
    recruiterUserId = recUser.userId;
    recruiterToken = jwtService.sign({
      sub: recUser.userId,
      email: recUser.email,
      roles: ['RECRUITER'],
      type: 'access',
    });

    // Create Candidate 1
    const cand1User = await prisma.user.create({
      data: {
        email: TEST_EMAILS[1],
        password: '123',
        status: 'ACTIVE',
        candidate: { create: { fullName: 'Cand 1' } },
        userRoles: { create: { roleId: roleCand.roleId } },
      },
      include: { candidate: true },
    });
    candidate1UserId = cand1User.userId;
    candidate1Token = jwtService.sign({
      sub: cand1User.userId,
      email: cand1User.email,
      roles: ['CANDIDATE'],
      type: 'access',
    });

    // Create Candidate 2
    const cand2User = await prisma.user.create({
      data: {
        email: TEST_EMAILS[2],
        password: '123',
        status: 'ACTIVE',
        candidate: { create: { fullName: 'Cand 2' } },
        userRoles: { create: { roleId: roleCand.roleId } },
      },
      include: { candidate: true },
    });
    candidate2UserId = cand2User.userId;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
    await app.close();
  });

  it('/messages/broadcast (POST) - Success', async () => {
    const [c1, c2] = await Promise.all([
      prisma.candidate.findFirst({ where: { userId: candidate1UserId } }),
      prisma.candidate.findFirst({ where: { userId: candidate2UserId } }),
    ]);

    const response = await request(app.getHttpServer())
      .post('/messages/broadcast')
      .set('Authorization', `Bearer ${recruiterToken}`)
      .send({
        candidateIds: [c1!.candidateId, c2!.candidateId],
        content: 'Broadcast test message',
      })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
  });

  it('/messages/conversations (GET) - Candidate 1 Success', async () => {
    const response = await request(app.getHttpServer())
      .get('/messages/conversations')
      .set('Authorization', `Bearer ${candidate1Token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].lastMessage).toBe('Broadcast test message');

    conversationId = response.body[0].conversationId;
  });

  it('/messages/conversations/:id/messages (GET) - Success', async () => {
    const response = await request(app.getHttpServer())
      .get(`/messages/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${candidate1Token}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0].content).toBe('Broadcast test message');
  });
});
