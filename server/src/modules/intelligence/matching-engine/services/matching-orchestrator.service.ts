import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
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
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      include: { company: true, branches: { include: { branch: true } } },
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
        this.logger.warn(
          `Lưu ý: pgvector chưa được kích hoạt, sử dụng RAM. ${dbErr.message}`,
        );
      }
      (job as any).embedding = vector;
    }

    // 2. Lấy danh sách ứng viên (Có thể tối ưu phân trang)
    let candidates = await this.prisma.candidate.findMany({
      where: { user: { status: 'ACTIVE' } },
      include: {
        cvs: {
          where: { isMain: true },
          include: {
            candidate: {
              include: {
                experiences: true,
                projects: true,
                skills: true,
              },
            },
          },
        },
        user: true,
        experiences: true,
        projects: true,
        skills: true,
      },
    });

    const isRemote = job.jobType === 'REMOTE';
    const jobLocation = (job.locationCity || '').toLowerCase().replace(/tp\.|thành phố|tỉnh/g, '').trim();
    const isJobHcm = jobLocation.includes('hồ chí minh') || jobLocation.includes('hcm');

    const structuredReqs = typeof job.structuredRequirements === 'string' 
      ? JSON.parse(job.structuredRequirements) 
      : (job.structuredRequirements || {});
      
    const jobCategories = Array.isArray(structuredReqs.categories) 
      ? structuredReqs.categories.map((c: string) => c.toLowerCase())
      : [];

    candidates = candidates.filter(candidate => {
      if (!isRemote && jobLocation) {
        const candLocRaw = (candidate.location || '').toLowerCase();
        if (!candLocRaw) return false;
        
        const candLoc = candLocRaw.replace(/tp\.|thành phố|tỉnh/g, '').trim();
        const isCandHcm = candLoc.includes('hồ chí minh') || candLoc.includes('hcm');
        
        const locationMatch = (isJobHcm && isCandHcm) || candLoc.includes(jobLocation) || jobLocation.includes(candLoc);
        if (!locationMatch) return false;
      }

      if (jobCategories.length > 0) {
        const candInds = (candidate.industries || []).map(i => i.toLowerCase());
        if (candInds.length === 0) return false;
        
        const hasOverlap = candInds.some(ind => jobCategories.some(cat => cat.includes(ind) || ind.includes(cat)));
        if (!hasOverlap) return false;
      }

      return true;
    });

    const results: any[] = [];

    // TỐI ƯU HÓA: Chia nhỏ danh sách ứng viên (Chunking) để xử lý song song, tăng tốc độ Matching
    const CHUNK_SIZE = 5; 
    const chunks: any[][] = [];
    for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
      chunks.push(candidates.slice(i, i + CHUNK_SIZE));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(async (candidate) => {
        const mainCv = candidate.cvs[0];
        if (!mainCv) return null;

        // 3. Đảm bảo CV có Embedding
        if (!(mainCv as any).embedding) {
          const parsedData = (mainCv.parsedData as any) || {};
          const text = `${parsedData.summary || ''} ${parsedData.experience || ''}`;
          const vector = await this.dataParser.getEmbedding(text);
          try {
            const vectorSql = `[${vector.join(',')}]`;
            await this.prisma.$executeRaw`
              UPDATE "CV" SET "embedding" = ${vectorSql}::vector WHERE "cvId" = ${mainCv.cvId}
            `;
          } catch (dbErr: any) {
            this.logger.warn(`pgvector error for CV. ${dbErr.message}`);
          }
          (mainCv as any).embedding = vector;
        }

        // 4. Tính điểm bằng Engine mới (9 yếu tố - Đã được tối ưu chạy song song bên trong)
        const { finalScore, breakdown, details } =
          await this.scoringEngine.calculateFinalScore(job, mainCv);

        // 5. Phân tích kết quả (UX)
        const analysis = this.matchAnalysis.generateAnalysis(breakdown, details);

        // 6. Lưu vào DB
        const matchRecord = await this.prisma.jobMatch.upsert({
          where: {
            candidateId_jobPostingId: {
              candidateId: candidate.candidateId,
              jobPostingId: jobId,
            },
          },
          update: {
            score: finalScore,
            matchedSkills: analysis.skillsAnalysis.matchedSkills,
            details: { breakdown, details } as any,
            updatedAt: new Date(),
          },
          create: {
            jobPostingId: jobId,
            candidateId: candidate.candidateId,
            score: finalScore,
            matchedSkills: analysis.skillsAnalysis.matchedSkills,
            details: { breakdown, details } as any,
          },
        });

        return matchRecord;
      });

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults.filter(Boolean));
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
        cvs: {
          where: { isMain: true },
          include: {
            candidate: {
              include: {
                experiences: true,
                projects: true,
                skills: true,
              },
            },
          },
        },
        user: true,
        skills: true,
        experiences: true,
        projects: true,
      },
    });

    if (!candidate || !candidate.cvs[0]) return [];
    const mainCv = candidate.cvs[0];

    // 1. Embedding (Always regenerate to reflect profile updates)
    const skillList = (candidate.skills || [])
      .map((s) => s.skillName)
      .join(', ');
    const desiredJob = candidate.desiredJob as any;
    const textForEmbedding =
      `${candidate.fullName} ${candidate.summary || ''} ${skillList} ${desiredJob?.title || ''}`.trim();

    if (textForEmbedding) {
      const vector = await this.dataParser.getEmbedding(textForEmbedding);
      const vectorSql = `[${vector.join(',')}]`;
      try {
        await this.prisma.$executeRaw`
          UPDATE "CV" SET "embedding" = ${vectorSql}::vector WHERE "cvId" = ${mainCv.cvId}
        `;
      } catch (e) {}
      (mainCv as any).embedding = vector;
    }

    // 2. Jobs
    const activeJobs = await this.prisma.jobPosting.findMany({
      where: { status: 'APPROVED' },
      include: { company: true, branches: { include: { branch: true } } },
    });

    const matchResults: any[] = [];
    for (const job of activeJobs) {
      if (!(job as any).embedding) {
        const vector = await this.dataParser.getEmbedding(
          `${job.title} ${job.requirements}`,
        );
        const vectorSql = `[${vector.join(',')}]`;
        try {
          await this.prisma.$executeRaw`
            UPDATE "JobPosting" SET "embedding" = ${vectorSql}::vector WHERE "jobPostingId" = ${job.jobPostingId}
          `;
        } catch (e) {}
        (job as any).embedding = vector;
      }

      // 3. Score
      const { finalScore, breakdown, details } =
        await this.scoringEngine.calculateFinalScore(job, mainCv);
      const analysis = this.matchAnalysis.generateAnalysis(breakdown, details);

      const matchRecord = await this.prisma.jobMatch.upsert({
        where: {
          candidateId_jobPostingId: {
            candidateId: candidate.candidateId,
            jobPostingId: job.jobPostingId,
          },
        },
        update: {
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          details: { breakdown, details } as any,
          updatedAt: new Date(),
        },
        create: {
          jobPostingId: job.jobPostingId,
          candidateId: candidate.candidateId,
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
          details: { breakdown, details } as any,
        },
      });
      matchResults.push(matchRecord);
    }

    return matchResults.sort((a, b) => b.score - a.score);
  }
}
