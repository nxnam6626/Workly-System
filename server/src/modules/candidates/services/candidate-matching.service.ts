import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MatchingOrchestratorService } from '../../matching-engine/services/matching-orchestrator.service';

@Injectable()
export class CandidateMatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matchingOrchestrator: MatchingOrchestratorService,
  ) { }

  async getRecommendedJobs(userId: string, page: number = 1, limit: number = 10) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate) return { items: [], total: 0, page, limit };

    const skip = (page - 1) * limit;

    let [matches, total] = await Promise.all([
      this.prisma.jobMatch.findMany({
        where: {
          candidateId: candidate.candidateId,
          score: { gte: 60 },
          jobPosting: { status: 'APPROVED' }
        },
        include: {
          jobPosting: {
            include: { company: true, branches: { include: { branch: true } } },
          },
        },
        orderBy: { score: 'desc' },
        skip,
        take: Number(limit),
      }),
      this.prisma.jobMatch.count({
        where: {
          candidateId: candidate.candidateId,
          score: { gte: 60 },
          jobPosting: { status: 'APPROVED' }
        },
      }),
    ]);

    if (matches.length === 0 && page === 1) {
      await this.matchingOrchestrator.runMatchingForCandidate(userId);
      [matches, total] = await Promise.all([
        this.prisma.jobMatch.findMany({
          where: {
            candidateId: candidate.candidateId,
            score: { gte: 60 },
            jobPosting: { status: 'APPROVED' }
          },
          include: {
            jobPosting: {
              include: { company: true, branches: { include: { branch: true } } },
            },
          },
          orderBy: { score: 'desc' },
          skip,
          take: Number(limit),
        }),
        this.prisma.jobMatch.count({
          where: {
            candidateId: candidate.candidateId,
            score: { gte: 60 },
            jobPosting: { status: 'APPROVED' }
          },
        }),
      ]);
    }

    return {
      items: matches.map((m) => ({
        ...m.jobPosting,
        branches: m.jobPosting.branches.map(b => b.branch),
        score: m.score,
        matchedSkills: m.matchedSkills,
      })),
      total,
      page: Number(page),
      limit: Number(limit),
    };
  }
}
