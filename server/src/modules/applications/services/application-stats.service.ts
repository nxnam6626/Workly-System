import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ApplicationStatsService {
  constructor(private prisma: PrismaService) { }

  async getRecruiterStats(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const stats = await this.prisma.application.groupBy({
      by: ['appStatus'],
      where: {
        jobPosting: {
          recruiterId: recruiter.recruiterId,
        },
      },
      _count: {
        applicationId: true,
      },
    });

    return stats.reduce((acc, curr) => {
      acc[curr.appStatus] = curr._count.applicationId;
      return acc;
    }, {});
  }
}
