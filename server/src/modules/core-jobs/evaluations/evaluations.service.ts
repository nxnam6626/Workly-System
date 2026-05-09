import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { EvalResult } from '@/generated/prisma';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EvaluationsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRecruiter(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      select: { recruiterId: true, companyId: true },
    });
    if (!recruiter) throw new UnauthorizedException('User is not a recruiter');
    return recruiter;
  }

  /** Upsert evaluation — 1 recruiter 1 round per application */
  async upsert(dto: CreateEvaluationDto, userId: string) {
    const recruiter = await this.getRecruiter(userId);
    const roundNumber = dto.roundNumber ?? 1;

    return this.prisma.interviewEvaluation.upsert({
      where: {
        applicationId_recruiterId_roundNumber: {
          applicationId: dto.applicationId,
          recruiterId: recruiter.recruiterId,
          roundNumber,
        },
      },
      create: {
        applicationId: dto.applicationId,
        recruiterId: recruiter.recruiterId,
        roundNumber,
        roundName: dto.roundName,
        sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : null,
        criteriaScores: dto.criteriaScores as any,
        overallRating: dto.overallRating ?? 0,
        notes: dto.notes,
        result: (dto.result as EvalResult) ?? EvalResult.PENDING,
      },
      update: {
        roundName: dto.roundName,
        sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : undefined,
        criteriaScores: dto.criteriaScores as any,
        overallRating: dto.overallRating,
        notes: dto.notes,
        result: dto.result as EvalResult,
      },
      include: {
        recruiter: { select: { fullName: true, user: { select: { avatar: true, userId: true } } } },
      },
    });
  }

  /** Get all evaluations for an application (all recruiters in same company) */
  async findByApplication(applicationId: string, userId: string) {
    const recruiter = await this.getRecruiter(userId);

    return this.prisma.interviewEvaluation.findMany({
      where: {
        applicationId,
        recruiter: { companyId: recruiter.companyId },
      },
      include: {
        recruiter: { select: { fullName: true, user: { select: { avatar: true, userId: true } } } },
      },
      orderBy: [{ roundNumber: 'asc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Get applications grouped by interview session (date) for a job posting.
   * Shows ALL applications that have an interviewDate set (any status).
   * Evaluations are scoped to same company (or same recruiter if no company).
   */
  async getSessionsForJob(jobId: string, userId: string) {
    const recruiter = await this.getRecruiter(userId);

    // Scope: same company evaluations, or fallback to own evaluations only
    const evalWhere = recruiter.companyId
      ? { recruiter: { companyId: recruiter.companyId } }
      : { recruiterId: recruiter.recruiterId };

    const applications = await this.prisma.application.findMany({
      where: {
        jobPostingId: jobId,
        // Show any application that has an interview date set
        OR: [
          { NOT: { interviewDate: null } },
          {
            appStatus: {
              in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED', 'ACCEPTED', 'REJECTED'],
            },
          },
        ],
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            user: { select: { avatar: true, email: true } },
            skills: { select: { skillName: true } },
          },
        },
        evaluations: {
          where: evalWhere,
          include: {
            recruiter: { select: { fullName: true, user: { select: { avatar: true } } } },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { interviewDate: 'asc' },
    });

    // Group by interviewDate
    const grouped: Record<string, { date: string; applications: any[] }> = {};

    for (const app of applications) {
      const dateKey = app.interviewDate
        ? new Date(app.interviewDate).toISOString().split('T')[0]
        : 'unscheduled';

      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, applications: [] };
      }

      // Compute avg score per application
      const allScores = app.evaluations.flatMap((e) => {
        const criteria = e.criteriaScores as { score: number; maxScore: number }[];
        return criteria.map((c) => (c.maxScore > 0 ? (c.score / c.maxScore) * 5 : 0));
      });
      const avgScore = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : null;

      grouped[dateKey].applications.push({ ...app, avgScore });
    }

    return Object.values(grouped).sort((a, b) => {
      if (a.date === 'unscheduled') return 1;
      if (b.date === 'unscheduled') return -1;
      return a.date.localeCompare(b.date);
    });
  }

  /** Get all sessions across ALL jobs belonging to the recruiter's company */
  async getAllSessions(userId: string) {
    const recruiter = await this.getRecruiter(userId);

    const evalWhere = recruiter.companyId
      ? { recruiter: { companyId: recruiter.companyId } }
      : { recruiterId: recruiter.recruiterId };

    // Get all job IDs belonging to this recruiter's company (or just them if no company)
    const myJobs = await this.prisma.jobPosting.findMany({
      where: recruiter.companyId 
        ? { companyId: recruiter.companyId }
        : { recruiterId: recruiter.recruiterId },
      select: { jobPostingId: true, title: true },
    });

    const jobIds = myJobs.map((j) => j.jobPostingId);
    const jobTitleMap = Object.fromEntries(myJobs.map((j) => [j.jobPostingId, j.title]));

    if (jobIds.length === 0) return [];

    const applications = await this.prisma.application.findMany({
      where: {
        jobPostingId: { in: jobIds },
        OR: [
          { NOT: { interviewDate: null } },
          { appStatus: { in: ['INTERVIEWING', 'INTERVIEW_CONFIRMED', 'RESCHEDULE_REQUESTED', 'ACCEPTED', 'REJECTED'] } },
        ],
      },
      include: {
        candidate: {
          select: {
            fullName: true,
            user: { select: { avatar: true, email: true } },
            skills: { select: { skillName: true } },
          },
        },
        evaluations: {
          where: evalWhere,
          include: {
            recruiter: { select: { fullName: true, user: { select: { avatar: true, userId: true } } } },
          },
          orderBy: { roundNumber: 'asc' },
        },
      },
      orderBy: { interviewDate: 'asc' },
    });

    const grouped: Record<string, { date: string; applications: any[] }> = {};

    for (const app of applications) {
      const dateKey = app.interviewDate
        ? new Date(app.interviewDate).toISOString().split('T')[0]
        : 'unscheduled';

      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, applications: [] };
      }

      const allScores = app.evaluations.flatMap((e) => {
        let criteria = e.criteriaScores || [];
        if (typeof criteria === 'string') {
          try { criteria = JSON.parse(criteria); } catch { criteria = []; }
        }
        if (!Array.isArray(criteria)) criteria = [];

        return criteria.map((c: any) => (c.maxScore > 0 ? (c.score / c.maxScore) * 5 : 0));
      });
      const avgScore = allScores.length > 0
        ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
        : null;

      grouped[dateKey].applications.push({
        ...app,
        avgScore,
        jobTitle: jobTitleMap[app.jobPostingId] || '',
      });
    }

    return Object.values(grouped).sort((a, b) => {
      if (a.date === 'unscheduled') return 1;
      if (b.date === 'unscheduled') return -1;
      return a.date.localeCompare(b.date);
    });
  }

  async scheduleNextRound(dto: { applicationId: string; interviewDate: string; interviewTime: string; interviewLocation?: string }, userId: string) {
    const recruiter = await this.getRecruiter(userId);
    const application = await this.prisma.application.findUnique({
      where: { applicationId: dto.applicationId },
      include: { jobPosting: { include: { recruiter: true } } },
    });
    if (!application) throw new NotFoundException('Application not found');

    // Check permissions
    if (application.jobPosting.recruiter?.companyId !== recruiter.companyId) {
      throw new UnauthorizedException('Not your candidate');
    }

    await this.prisma.application.update({
      where: { applicationId: dto.applicationId },
      data: {
        interviewDate: new Date(dto.interviewDate),
        interviewTime: dto.interviewTime,
        interviewLocation: dto.interviewLocation || '',
        appStatus: 'INTERVIEWING',
      },
    });

    const existingEvals = await this.prisma.interviewEvaluation.findMany({
      where: { applicationId: dto.applicationId },
      select: { roundNumber: true },
    });
    const maxRound = existingEvals.length > 0 ? Math.max(...existingEvals.map(e => e.roundNumber)) : 0;
    const nextRound = maxRound + 1;

    // Create a placeholder evaluation to establish the new round
    await this.prisma.interviewEvaluation.create({
      data: {
        applicationId: dto.applicationId,
        recruiterId: recruiter.recruiterId,
        roundNumber: nextRound,
        roundName: `Vòng ${nextRound}`,
        sessionDate: new Date(dto.interviewDate),
      }
    });

    return { success: true };
  }

  async remove(evaluationId: string, userId: string) {
    const recruiter = await this.getRecruiter(userId);
    const evaluation = await this.prisma.interviewEvaluation.findUnique({
      where: { evaluationId },
    });
    if (!evaluation) throw new NotFoundException('Evaluation not found');
    if (evaluation.recruiterId !== recruiter.recruiterId)
      throw new UnauthorizedException('Not your evaluation');

    return this.prisma.interviewEvaluation.delete({ where: { evaluationId } });
  }

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
