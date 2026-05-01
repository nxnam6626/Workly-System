import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CandidateInteractionService {
  private readonly logger = new Logger(CandidateInteractionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async toggleSave(candidateId: string, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const { savedCandidateIds } = recruiter;
    const isSaved = savedCandidateIds.includes(candidateId);

    const newSavedCandidateIds = isSaved
      ? savedCandidateIds.filter((id) => id !== candidateId)
      : [...savedCandidateIds, candidateId];

    await this.prisma.recruiter.update({
      where: { userId },
      data: { savedCandidateIds: newSavedCandidateIds },
    });

    return { saved: !isSaved, candidateId };
  }

  async getSavedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const savedCandidates = await this.prisma.candidate.findMany({
      where: { candidateId: { in: recruiter.savedCandidateIds } },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        cvs: {
          select: {
            cvId: true,
            cvTitle: true,
            fileUrl: true,
            isMain: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    });

    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
      select: { candidateId: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

    return savedCandidates.map((candidate) => {
      const isUnlocked = unlockedIds.has(candidate.candidateId);
      return {
        ...candidate,
        fullName: isUnlocked
          ? candidate.fullName
          : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
        user: {
          ...candidate.user,
          avatar: isUnlocked ? candidate.user?.avatar : null,
          email: isUnlocked ? candidate.user?.email : '****@***.com',
          phoneNumber: isUnlocked
            ? candidate.user?.phoneNumber
            : '****-***-***',
        },
        isUnlocked,
      };
    });
  }
}
