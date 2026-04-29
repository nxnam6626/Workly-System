import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { MatchingOrchestratorService } from '../../../matching-engine/services/matching-orchestrator.service';

@Injectable()
export class JobRecommendationService {
  constructor(
    private prisma: PrismaService,
    private matchingOrchestrator: MatchingOrchestratorService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  async getSuggestedCandidates(jobId: string, recruiterUserIdFromToken?: string) {
    const jobPost = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      select: { status: true, structuredRequirements: true },
    });

    if (jobPost?.status === 'REJECTED') {
      return [];
    }

    let matches = await this.prisma.jobMatch.findMany({
      where: { jobPostingId: jobId },
      orderBy: { score: 'desc' },
      take: 20,
    });

    if (matches.length === 0) {
      await this.matchingQueue.add('match', { jobId });
      return [];
    }

    let recruiterId: string | null = null;
    if (recruiterUserIdFromToken) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId: recruiterUserIdFromToken },
      });
      if (recruiter) recruiterId = recruiter.recruiterId;
    }

    const unlockedIds = new Set();
    if (recruiterId) {
      const unlocked = await this.prisma.candidateUnlock.findMany({
        where: { recruiterId, jobPostingId: jobId },
        select: { candidateId: true },
      });
      unlocked.forEach((u) => unlockedIds.add(u.candidateId));
    }

    const enriched = await Promise.all(
      matches.map(async (m) => {
        const isUnlocked = unlockedIds.has(m.candidateId);
        const candidate = await this.prisma.candidate.findUnique({
          where: { candidateId: m.candidateId },
          include: {
            user: { select: { avatar: true, email: true } },
            cvs: {
              where: { parsedData: { not: Prisma.JsonNull } },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
        });

        const jobReqs = jobPost?.structuredRequirements as any;
        const hardSkills = jobReqs?.hardSkills || [];
        const missingSkills = hardSkills.filter(s =>
          !m.matchedSkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()))
        );

        return {
          ...m,
          fullName: isUnlocked ? candidate?.fullName || 'Ứng viên' : `Ứng viên #${m.candidateId.slice(0, 4)}`,
          email: isUnlocked ? candidate?.user?.email : '***@***.***',
          major: candidate?.major || '',
          user: { avatar: isUnlocked ? candidate?.user?.avatar : null },
          isUnlocked,
          missingSkills,
          analysis: {
            hardSkillsCount: hardSkills.length,
            matchedCount: m.matchedSkills.length,
            missingCount: missingSkills.length,
            experienceMatch: (candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp >= (jobReqs?.minExperienceYears || 0),
            totalYearsExp: (candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp || 0,
            requiredExp: jobReqs?.minExperienceYears || 0
          }
        };
      }),
    );

    return enriched
      .filter((m) => m.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  async getRecommendations(userId: string) {
    const matches = await this.matchingOrchestrator.runMatchingForCandidate(userId);
    return (matches as any[]).filter((m) => m.score >= 60);
  }
}
