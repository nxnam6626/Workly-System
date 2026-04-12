import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async toggle(jobPostingId: string, userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Không tìm thấy thông tin ứng viên.');
    }

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId },
    });

    if (!job) {
      throw new NotFoundException('Không tìm thấy tin tuyển dụng.');
    }

    const existing = await this.prisma.savedJob.findUnique({
      where: {
        candidateId_jobPostingId: {
          candidateId: candidate.candidateId,
          jobPostingId,
        },
      },
    });

    if (existing) {
      await this.prisma.savedJob.delete({
        where: { savedJobId: existing.savedJobId },
      });
      return { saved: false, message: 'Đã bỏ lưu tin tuyển dụng.' };
    }

    await this.prisma.savedJob.create({
      data: {
        candidateId: candidate.candidateId,
        jobPostingId,
      },
    });

    return { saved: true, message: 'Đã lưu tin tuyển dụng thành công.' };
  }

  async findAllForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) return [];

    const savedJobs = await this.prisma.savedJob.findMany({
      where: { candidateId: candidate.candidateId },
      include: {
        jobPosting: {
          include: {
            company: true,
          },
        },
      },
      orderBy: { savedAt: 'desc' },
    });

    // Extract jobPostingIds to check applications in bulk
    const jobPostingIds = savedJobs.map(sj => sj.jobPostingId);
    
    // Check which of these jobs have already been applied for
    const applications = await this.prisma.application.findMany({
      where: {
        candidateId: candidate.candidateId,
        jobPostingId: { in: jobPostingIds },
      },
      select: { jobPostingId: true },
    });
    
    const appliedJobIds = new Set(applications.map(a => a.jobPostingId));

    return savedJobs.map(sj => ({
      ...sj.jobPosting,
      hasApplied: appliedJobIds.has(sj.jobPostingId),
    }));
  }
}

