import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { SearchService } from '../../../search/search.service';
import { FilterJobPostingDto } from '../dto/filter-job-posting.dto';
import { JobStatus } from '@prisma/client';
import { HIERARCHICAL_INDUSTRIES } from './job-category.service';

@Injectable()
export class JobSearchService {
  private readonly logger = new Logger(JobSearchService.name);

  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) { }

  async syncJobToES(job: any) {
    await this.searchService.indexJob({
      id: job.jobPostingId,
      title: job.title,
      description: job.description,
      companyId: job.companyId,
      companyName: job.company?.companyName || undefined,
      originalUrl: job.originalUrl,
      locationCity: job.locationCity,
      jobType: job.jobType,
      experience: job.experience,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      createdAt: job.createdAt,
      refreshedAt: job.refreshedAt,
      jobTier: job.jobTier,
      jobLevel: job.jobLevel,
      status: job.status,
      industry: (job.structuredRequirements as any)?.categories?.length > 0 ? (job.structuredRequirements as any).categories : ['Đa lĩnh vực / Khác'],
    });
  }

  async syncAllJobsToES() {
    await this.searchService.recreateIndex();
    const jobs = await this.prisma.jobPosting.findMany({
      where: { status: JobStatus.APPROVED },
      include: { company: true },
    });
    for (const job of jobs) {
      await this.syncJobToES(job);
    }
    return { count: jobs.length };
  }

  async findAll(query: FilterJobPostingDto, userId?: string) {
    const {
      search,
      location,
      jobType,
      jobTier,
      jobLevel,
      page = 1,
      limit = 10,
      industry,
      experience,
      salaryMin,
      salaryMax,
      sortBy,
    } = query;

    let ids: string[] = [];
    let total = 0;
    try {
      const result = await this.searchService.searchJobs({
        search,
        location,
        jobTier,
        jobLevel,
        jobType,
        industry,
        experience,
        salaryMin,
        salaryMax,
        sortBy,
        page,
        limit,
      });
      ids = result.ids;
      total = result.total;
    } catch (error) {
      this.logger.warn('Elasticsearch failed, falling back to Prisma', error?.message);
      return this.findAllPrisma(query, userId);
    }

    if (ids.length === 0 && total === 0 && !search) {
      return this.findAllPrisma(query, userId);
    }

    if (ids.length === 0) {
      return this.findAllPrisma(query, userId);
    }

    const whereCondition: any = {
      jobPostingId: { in: ids },
      status: 'APPROVED',
    };
    if (jobTier) whereCondition.jobTier = jobTier;
    if (jobLevel) whereCondition.jobLevel = jobLevel as any;

    const locationCond = this.buildLocationCondition(location);
    if (locationCond) {
      whereCondition.AND = [locationCond];
    }

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter) {
        whereCondition.NOT = { recruiterId: recruiter.recruiterId };
      }
    }

    const items = await this.prisma.jobPosting.findMany({
      where: whereCondition,
      include: {
        company: true,
        recruiter: true,
        branches: {
          include: { branch: true },
        },
      },
    });

    let sortedItems = ids
      .map((id) => {
        const item = items.find((it) => it.jobPostingId === id) as any;
        if (item) {
          item.branches = item.branches.map((b: any) => b.branch);
        }
        return item;
      })
      .filter((item) => !!item) as any[];

    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: ids },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map((a) => a.jobPostingId));
        sortedItems = sortedItems.map((item) => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items: sortedItems, total, page, limit };
  }

  async findAllPrisma(query: FilterJobPostingDto, userId?: string) {
    const { search, location, jobType, jobTier, jobLevel, page = 1, limit = 10, industry, sortBy } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'APPROVED',
    };

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter) {
        where.NOT = { recruiterId: recruiter.recruiterId };
      }
    }

    let industriesToMatch: string[] = [];
    let industryKeywords: string[] = [];

    if (industry) {
      const targetCat = HIERARCHICAL_INDUSTRIES.find(c => c.category === industry);
      if (targetCat) {
        industriesToMatch = [targetCat.category, ...targetCat.subCategories];
        industryKeywords = targetCat.keywords;
      } else {
        industriesToMatch = [industry];
      }
    }

    const andClauses: any[] = [];
    const locationCond = this.buildLocationCondition(location);
    if (locationCond) andClauses.push(locationCond);

    if (jobType) where.jobType = jobType;
    if (jobTier) where.jobTier = jobTier;
    if (jobLevel) where.jobLevel = jobLevel;

    if (search) {
      const searchWords = search.split(/\s+/).filter((w) => w.length > 1);
      if (searchWords.length > 1) {
        andClauses.push({
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              AND: searchWords.map((word) => ({
                OR: [
                  { title: { contains: word, mode: "insensitive" } },
                  { description: { contains: word, mode: "insensitive" } },
                ],
              })),
            },
            {
              company: { companyName: { contains: search, mode: "insensitive" } },
            },
          ],
        });
      } else {
        andClauses.push({
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            {
              company: { companyName: { contains: search, mode: "insensitive" } },
            },
          ],
        });
      }
    }

    if (industriesToMatch.length > 0 || industryKeywords.length > 0) {
      const industryConds: any[] = [];
      if (industriesToMatch.length > 0) {
        industriesToMatch.forEach(name => {
          industryConds.push({
            structuredRequirements: {
              path: ['categories'],
              array_contains: name
            }
          });
        });
      }
      const allKeywords = [...new Set([...industriesToMatch, ...industryKeywords])];
      allKeywords.forEach((kw) => {
        industryConds.push({ title: { contains: kw, mode: 'insensitive' } });
        industryConds.push({ description: { contains: kw, mode: 'insensitive' } });
        industryConds.push({ requirements: { contains: kw, mode: 'insensitive' } });
      });
      andClauses.push({ OR: industryConds });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    let orderBy: any = [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];
    if (sortBy === 'new') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (sortBy === 'updated') {
      orderBy = [{ refreshedAt: 'desc' }];
    } else if (sortBy === 'salary') {
      orderBy = [{ salaryMax: 'desc' }];
    } else if (sortBy === 'suitable') {
      orderBy = [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];
    }

    let [items, total] = (await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: true,
          branches: {
            include: { branch: true },
          },
        },
        orderBy: orderBy,
      }),
      this.prisma.jobPosting.count({ where }),
    ])) as [any[], number];

    items = items.map((item) => ({
      ...item,
      branches: item.branches.map((b: any) => b.branch),
    }));

    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        const jobPostingIds = items.map((item) => item.jobPostingId);
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: jobPostingIds },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map((a) => a.jobPostingId));
        items = items.map((item) => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items, total, page, limit };
  }

  buildLocationCondition(location?: string): any | undefined {
    if (!location) return undefined;

    const LOCATION_ALIASES: Record<string, string[]> = {
      'Hồ Chí Minh': ['TPHCM', 'TP HCM', 'TP. HCM', 'Ho Chi Minh', 'HCM', 'Thành phố Hồ Chí Minh', 'TP Hồ Chí Minh'],
      'Hà Nội': ['Ha Noi', 'Hanoi', 'Thành phố Hà Nội', 'TP Hà Nội', 'TP. Hà Nội'],
      'Đà Nẵng': ['Da Nang', 'Danang', 'Thành phố Đà Nẵng'],
      'Cần Thơ': ['Can Tho', 'Thành phố Cần Thơ'],
      'Hải Phòng': ['Hai Phong', 'Thành phố Hải Phòng'],
    };

    const variants = new Set<string>([location]);
    if (LOCATION_ALIASES[location]) {
      LOCATION_ALIASES[location].forEach((v) => variants.add(v));
    }

    for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
      if (aliases.some((a) => a.toLowerCase() === location.toLowerCase())) {
        variants.add(canonical);
        aliases.forEach((v) => variants.add(v));
      }
    }

    return {
      OR: Array.from(variants).map((v) => ({
        locationCity: { contains: v, mode: 'insensitive' },
      })),
    };
  }
}
