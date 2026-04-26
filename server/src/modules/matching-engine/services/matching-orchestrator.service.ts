// eslint-disable-next-line @typescript-eslint/no-require-imports
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ScoringEngineService } from './scoring-engine.service';
import { DataParserService } from './data-parser.service';
import { MatchAnalysisService } from './match-analysis.service';

@Injectable()
export class MatchingOrchestratorService {
  private readonly logger = new Logger(MatchingOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly scoringEngine: ScoringEngineService,
    private readonly dataParser: DataParserService,
    private readonly matchAnalysis: MatchAnalysisService,
  ) {}

  /**
   * Chạy Matching cho một Job mới đăng/được duyệt
   */
  async runMatchingForJob(jobId: string) {
    this.logger.log(`Starting Orchestrator matching for Job: ${jobId}`);

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      include: { company: true },
    });

    if (!job) return [];

    // 1. Đảm bảo Job có Embedding
    if (!(job as any).embedding) {
      const textForEmbedding = `${job.title} ${job.description} ${job.requirements}`;
      const vector = await this.dataParser.getEmbedding(textForEmbedding);
      const vectorSql = `[${vector.join(',')}]`;
      try {
        await this.prisma.$executeRaw`
          UPDATE "JobPosting" 
          SET "embedding" = ${vectorSql}::vector 
          WHERE "jobPostingId" = ${jobId}
        `;
      } catch (dbErr: any) {
        this.logger.warn(`Lưu ý: Chưa bật PostgreSQL pgvector, hệ thống tự động chạy thuật toán RAM/Cosine Similarity dự phòng để tính tỷ lệ Matching. Chi tiết lỗi bỏ qua: ${dbErr.message}`);
      }
      (job as any).embedding = vector;

    }

    // 2. Lấy danh sách ứng viên (Cần tối ưu phân trang nếu DB lớn)
    const whereCandidate: any = { user: { status: 'ACTIVE' } };

    // -- LOCATION FILTER --
    const isRemote = job.locationCity?.toLowerCase().includes('remote') || 
                     job.title.toLowerCase().includes('remote') ||
                     (job.structuredRequirements as any)?.hardSkills?.some((s: any) => typeof s === 'string' && s.toLowerCase() === 'remote');
                     
    if (!isRemote && job.locationCity) {
      const location = job.locationCity;
      const LOCATION_ALIASES: Record<string, string[]> = {
        'Hồ Chí Minh': ['TPHCM', 'TP HCM', 'TP. HCM', 'Ho Chi Minh', 'HCM', 'Thành phố Hồ Chí Minh', 'TP Hồ Chí Minh'],
        'Hà Nội': ['Ha Noi', 'Hanoi', 'Thành phố Hà Nội', 'TP Hà Nội', 'TP. Hà Nội'],
        'Đà Nẵng': ['Da Nang', 'Danang', 'Thành phố Đà Nẵng'],
        'Cần Thơ': ['Can Tho', 'Thành phố Cần Thơ'],
        'Hải Phòng': ['Hai Phong', 'Thành phố Hải Phòng'],
      };
      const variants = new Set<string>([location]);
      if (LOCATION_ALIASES[location]) LOCATION_ALIASES[location].forEach((v) => variants.add(v));
      for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
        if (aliases.some((a) => a.toLowerCase() === location.toLowerCase())) {
          variants.add(canonical);
          aliases.forEach((a) => variants.add(a));
        }
      }

      whereCandidate.OR = Array.from(variants).map(v => ({ location: { contains: v, mode: 'insensitive' } }));
      // Allow candidates who haven't updated location yet
      whereCandidate.OR.push({ location: null });
      whereCandidate.OR.push({ location: '' });
    }

    let candidates = await this.prisma.candidate.findMany({
      where: whereCandidate,
      include: { 
        cvs: { where: { isMain: true } },
        user: true 
      },
    });

    // -- CATEGORY FILTER (INDUSTRY CLUSTERING) --
    // Only process candidates whose CV category overlaps with Job categories (or if no category assigned yet)
    const jobCategories = (job.structuredRequirements as any)?.categories as string[] || [];
    if (jobCategories.length > 0) {
      candidates = candidates.filter(c => {
        if (!c.cvs[0]) return false;
        const cvCats = (c.cvs[0].parsedData as any)?.categories as string[];
        // Fallback for old CVs without categories: allow them to be scored
        if (!Array.isArray(cvCats) || cvCats.length === 0) return true;
        // Intersection check
        return cvCats.some(cat => jobCategories.includes(cat));
      });
    }

    const results: any[] = [];

    for (const candidate of candidates) {
      const mainCv = candidate.cvs[0];
      if (!mainCv) continue;

      // 3. Đảm bảo CV có Embedding
      if (!(mainCv as any).embedding) {
        const parsedData = (mainCv.parsedData as any) || {};
        const skillNames = Array.isArray(parsedData.skills)
          ? parsedData.skills.join(' ')
          : [
              ...(parsedData.skills?.hard_skills || []),
              ...(parsedData.skills?.soft_skills || [])
            ].map(s => typeof s === 'string' ? s : s.skillName).join(' ');
            
        const textForEmbedding = `${parsedData.summary || ''} ${parsedData.experience || ''} ${skillNames}`;
        const vector = await this.dataParser.getEmbedding(textForEmbedding);
        try {
          const vectorSql = `[${vector.join(',')}]`;
          await this.prisma.$executeRaw`
            UPDATE "CV" 
            SET "embedding" = ${vectorSql}::vector 
            WHERE "cvId" = ${mainCv.cvId}
          `;
        } catch (dbErr: any) {
          this.logger.warn(`Lưu ý: Chưa bật PostgreSQL pgvector, sử dụng bộ nhớ RAM để quét Matching cho ứng viên. Chi tiết lỗi bỏ qua: ${dbErr.message}`);
        }
        (mainCv as any).embedding = vector;
      }

      // 4. Tính điểm bằng Engine mới
      const { finalScore, breakdown, details } = await this.scoringEngine.calculateFinalScore(
        job,
        mainCv,
        { isCompanyVerified: job.company?.verifyStatus === 1 }
      );

      // 5. Phân tích kết quả (UX)
      const analysis = this.matchAnalysis.generateAnalysis(breakdown, details);

      // 6. Lưu vào DB
      const matchRecord = await this.prisma.jobMatch.upsert({
        where: {
          candidateId_jobPostingId: { 
            candidateId: candidate.candidateId, 
            jobPostingId: jobId 
          },
        },
        update: {
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          updatedAt: new Date(),
        },
        create: {
          jobPostingId: jobId,
          candidateId: candidate.candidateId,
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
        },
      });

      results.push(matchRecord);
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Chạy Matching cho một Ứng viên mới cập nhật CV
   */
  async runMatchingForCandidate(userId: string) {
    const candidate = await this.prisma.candidate.findFirst({
      where: { userId },
      include: { 
        cvs: { where: { isMain: true } },
        user: true 
      },
    });

    if (!candidate || !candidate.cvs[0]) return [];
    const mainCv = candidate.cvs[0];

    // Đảm bảo CV có embedding
    if (!(mainCv as any).embedding) {
      const parsedData = (mainCv.parsedData as any) || {};
      const skillNames = Array.isArray(parsedData.skills)
        ? parsedData.skills.join(' ')
        : [
            ...(parsedData.skills?.hard_skills || []),
            ...(parsedData.skills?.soft_skills || [])
          ].map(s => typeof s === 'string' ? s : s.skillName).join(' ');

      const text = `${parsedData.summary || ''} ${skillNames}`;
      const vector = await this.dataParser.getEmbedding(text);
      const vectorSql = `[${vector.join(',')}]`;
      try {
        await this.prisma.$executeRaw`
          UPDATE "CV" 
          SET "embedding" = ${vectorSql}::vector 
          WHERE "cvId" = ${mainCv.cvId}
        `;
      } catch (dbErr: any) {
        this.logger.warn(`Failed to update CV embedding in DB (possibly missing pgvector extension): ${dbErr.message}`);
      }
      (mainCv as any).embedding = vector;
    }

    const activeJobs = await this.prisma.jobPosting.findMany({
      where: { status: 'APPROVED' },
      include: { company: true },
    });

    const matchResults: any[] = [];
    for (const job of activeJobs) {
      if (!(job as any).embedding) {
        const vector = await this.dataParser.getEmbedding(`${job.title} ${job.requirements}`);
        const vectorSql = `[${vector.join(',')}]`;
        try {
          await this.prisma.$executeRaw`
            UPDATE "JobPosting" 
            SET "embedding" = ${vectorSql}::vector 
            WHERE "jobPostingId" = ${job.jobPostingId}
          `;
        } catch (dbErr: any) {
          this.logger.warn(`Failed to update JobPosting embedding in DB (possibly missing pgvector extension): ${dbErr.message}`);
        }
        (job as any).embedding = vector;
      }

      const { finalScore, breakdown, details } = await this.scoringEngine.calculateFinalScore(job, mainCv);
      const analysis = this.matchAnalysis.generateAnalysis(breakdown, details);

      const matchRecord = await this.prisma.jobMatch.upsert({
        where: { 
          candidateId_jobPostingId: { 
            candidateId: candidate.candidateId, 
            jobPostingId: job.jobPostingId 
          } 
        },
        update: { 
          score: finalScore, 
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          updatedAt: new Date(),
        },
        create: {
          jobPostingId: job.jobPostingId,
          candidateId: candidate.candidateId,
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
        },
      });
      matchResults.push(matchRecord);
    }

    return matchResults.sort((a, b) => b.score - a.score);
  }
}
