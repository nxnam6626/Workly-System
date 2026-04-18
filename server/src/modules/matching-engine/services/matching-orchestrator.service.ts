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
      await this.prisma.$executeRaw`
        UPDATE "JobPosting" 
        SET "embedding" = ${vectorSql}::vector 
        WHERE "jobPostingId" = ${jobId}
      `;
      (job as any).embedding = vector;
    }

    // 2. Lấy danh sách ứng viên (Cần tối ưu phân trang nếu DB lớn)
    const candidates = await this.prisma.candidate.findMany({
      where: { user: { status: 'ACTIVE' } },
      include: { 
        cvs: { where: { isMain: true } },
        user: true 
      },
    });

    const results: any[] = [];

    for (const candidate of candidates) {
      const mainCv = candidate.cvs[0];
      if (!mainCv) continue;

      // 3. Đảm bảo CV có Embedding
      if (!(mainCv as any).embedding) {
        const parsedData = (mainCv.parsedData as any) || {};
        const textForEmbedding = `${parsedData.summary || ''} ${parsedData.experience || ''} ${(parsedData.skills || []).join(' ')}`;
        const vector = await this.dataParser.getEmbedding(textForEmbedding);
        const vectorSql = `[${vector.join(',')}]`;
        await this.prisma.$executeRaw`
          UPDATE "CV" 
          SET "embedding" = ${vectorSql}::vector 
          WHERE "cvId" = ${mainCv.cvId}
        `;
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

    if (!candidate || !candidate.cvs[0]) return { success: true, results: [] };
    const mainCv = candidate.cvs[0];

    // Đảm bảo CV có embedding
    if (!(mainCv as any).embedding) {
      const parsedData = (mainCv.parsedData as any) || {};
      const text = `${parsedData.summary || ''} ${(parsedData.skills || []).join(' ')}`;
      const vector = await this.dataParser.getEmbedding(text);
      const vectorSql = `[${vector.join(',')}]`;
      await this.prisma.$executeRaw`
        UPDATE "CV" 
        SET "embedding" = ${vectorSql}::vector 
        WHERE "cvId" = ${mainCv.cvId}
      `;
      (mainCv as any).embedding = vector;
    }

    const activeJobs = await this.prisma.jobPosting.findMany({
      where: { status: 'APPROVED' },
      include: { company: true },
    });

    for (const job of activeJobs) {
      if (!(job as any).embedding) {
        const vector = await this.dataParser.getEmbedding(`${job.title} ${job.requirements}`);
        const vectorSql = `[${vector.join(',')}]`;
        await this.prisma.$executeRaw`
          UPDATE "JobPosting" 
          SET "embedding" = ${vectorSql}::vector 
          WHERE "jobPostingId" = ${job.jobPostingId}
        `;
        (job as any).embedding = vector;
      }

      const { finalScore, breakdown, details } = await this.scoringEngine.calculateFinalScore(job, mainCv);
      const analysis = this.matchAnalysis.generateAnalysis(breakdown, details);

      await this.prisma.jobMatch.upsert({
        where: { 
          candidateId_jobPostingId: { 
            candidateId: candidate.candidateId, 
            jobPostingId: job.jobPostingId 
          } 
        },
        update: { 
          score: finalScore, 
          matchedSkills: analysis.skillsAnalysis.matchedSkills 
        },
        create: {
          jobPostingId: job.jobPostingId,
          candidateId: candidate.candidateId,
          score: finalScore,
          matchedSkills: analysis.skillsAnalysis.matchedSkills,
        },
      });
    }

    return { success: true, results: activeJobs };
  }
}
