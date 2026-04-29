import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecruiterJdAnalysisService } from './services/recruiter-jd-analysis.service';
import { RecruiterAggregateService } from './services/recruiter-aggregate.service';

@Injectable()
export class AiInsightsService {
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jdAnalysisService: RecruiterJdAnalysisService,
    private readonly aggregateService: RecruiterAggregateService,
  ) { }

  async generateRecruiterInsights(userId: string, forceRefresh: boolean = false): Promise<any> {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: {
        recruiterSubscription: true,
        jobPostings: {
          where: { status: { in: ['APPROVED', 'PENDING', 'EXPIRED'] } },
          orderBy: { updatedAt: 'desc' },
          include: { _count: { select: { applications: true } } },
        },
      },
    });

    if (!recruiter) return { insights: [], stats: [], jdScores: [] };

    const allJobs = recruiter.jobPostings;
    const activeJobs = allJobs.filter((j) => j.status === 'APPROVED');
    const totalViews = activeJobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);
    const totalApplicants = activeJobs.reduce((sum, j) => sum + j._count.applications, 0);
    const avgApplyRate = totalViews > 0 ? ((totalApplicants / totalViews) * 100).toFixed(1) : '0';

    const latestUpdate = allJobs[0]?.updatedAt?.getTime() ?? 0;
    const cacheKey = `${allJobs.length}:${latestUpdate}:${totalApplicants}_v11`;
    const cachedPayload = recruiter.aiInsightsCache as any;

    const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
    const isCacheFresh = recruiter.aiInsightsCachedAt && Date.now() - new Date(recruiter.aiInsightsCachedAt).getTime() < CACHE_TTL_MS;

    const stats = {
      totalJobs: allJobs.length,
      activeJobs: activeJobs.length,
      totalViews,
      totalApplicants,
      avgApplyRate: parseFloat(avgApplyRate),
    };

    if (!forceRefresh && cachedPayload && (recruiter.aiInsightsCacheKey === cacheKey || isCacheFresh)) {
      this.logger.log(`[AiInsightsService] Returning cached insights for recruiter ${recruiter.recruiterId}`);
      return { ...cachedPayload, stats };
    }

    const finalJdScores: any[] = [];
    await this.jdAnalysisService.analyzeMissingJds(activeJobs, finalJdScores);

    return this.aggregateService.generateAggregateInsights(recruiter, stats, finalJdScores, cacheKey);
  }
}
