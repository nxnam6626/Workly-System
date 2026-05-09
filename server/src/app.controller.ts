import { Controller, Get } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prisma: PrismaService) {}

  @Get()
  getHello(): string {
    return 'Hello from Workly Server!';
  }

  @Get('debug-apps')
  async debugApps() {
    return this.prisma.application.findMany({
      include: { evaluations: true }
    });
  }

  @Get('debug-candidate')
  async debugCandidate() {
    return this.prisma.application.findMany({
      where: {
        candidate: { fullName: { contains: 'Duy Tiến' } }
      },
      include: { evaluations: true }
    });
  }

  @Get('create-test-user')
  async createTestUser() {
    const taxCode = '0101243150';
    const email = 'hrmisa@gmail.com';
    const passwordHash = await bcrypt.hash('123456', 10);

    let company = await this.prisma.company.findUnique({ where: { taxCode } });
    if (!company) {
      company = await this.prisma.company.create({
        data: {
          companyName: 'MISA JSC',
          taxCode: taxCode,
          isRegistered: true,
          verifyStatus: 1,
        }
      });
    }

    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: email,
          password: passwordHash,
          status: 'ACTIVE',
          isEmailVerified: true,
        }
      });
    }

    let role = await this.prisma.role.findUnique({ where: { roleName: 'RECRUITER' } });
    if (!role) {
      role = await this.prisma.role.create({ data: { roleName: 'RECRUITER' } });
    }

    await this.prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.userId, roleId: role.roleId } },
      create: { userId: user.userId, roleId: role.roleId },
      update: {}
    });

    let recruiter = await this.prisma.recruiter.findUnique({ where: { userId: user.userId } });
    if (!recruiter) {
      recruiter = await this.prisma.recruiter.create({
        data: {
          userId: user.userId,
          companyId: company.companyId,
          fullName: 'HR MISA',
        }
      });
    }

    const wallet = await this.prisma.companyWallet.findUnique({ where: { companyId: company.companyId } });
    if (!wallet) {
      await this.prisma.companyWallet.create({
        data: {
          companyId: company.companyId,
          balance: 10000000,
          cvUnlockQuota: 100,
          cvUnlockQuotaMax: 100,
        }
      });
    }

    return { success: true, email: user.email, company: company.companyName, recruiterId: recruiter.recruiterId };
  }
}
