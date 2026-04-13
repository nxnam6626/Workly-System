import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) { }

  async runMatchingForJob(jobId: string) {
    this.logger.log(`Bắt đầu chạy Matching cho Job ID: ${jobId}`);

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
    });

    if (!job || !job.structuredRequirements) {
      this.logger.warn(`Job không tồn tại hoặc không có yêu cầu cấu trúc.`);
      return [];
    }

    const reqs = job.structuredRequirements as any;
    const { hardSkills = [], softSkills = [], minExperienceYears = 0 } = reqs;

    // Lấy tất cả CV đã được bóc tách và ở trạng thái PUBLISHED
    const allCvs = await this.prisma.cV.findMany({
      where: {
        parsedData: { not: Prisma.JsonNull },
      },
      select: { candidateId: true, parsedData: true, cvId: true },
    }) as any[];

    const matches = allCvs.map((cv) => {
      const parsedData = cv.parsedData as any;
      const cvSkills = parsedData.skills || [];
      const cvExp = parsedData.totalYearsExp || 0;

      // 1. Tính điểm Kỹ năng (60%)
      const matchedHard = hardSkills.filter((s: string) =>
        cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
        })
      );
      const hardScore = hardSkills.length > 0 ? (matchedHard.length / hardSkills.length) : 1;

      const matchedSoft = softSkills.filter((s: string) =>
        cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
        })
      );
      const softScore = softSkills.length > 0 ? (matchedSoft.length / softSkills.length) : 1;

      const skillScore = (hardScore * 0.8) + (softScore * 0.2);

      // 2. Tính điểm Kinh nghiệm (30%)
      let expScore = 1;
      if (minExperienceYears > 0) {
        expScore = Math.min(cvExp / minExperienceYears, 1.2);
      }

      // 3. Điểm tổng hợp
      const finalScore = (skillScore * 0.6) + (expScore * 0.4);

      return {
        candidateId: cv.candidateId,
        cvId: cv.cvId,
        score: Math.round(finalScore * 100),
        matchedSkills: [...matchedHard, ...matchedSoft],
      };
    });

    // 4. Gom nhóm hồ sơ (Deduplication) - Chọn CV tốt nhất của mỗi ứng viên
    const bestMatchesMap = matches.reduce((acc, current) => {
      const existing = acc.get(current.candidateId);
      if (!existing || current.score > existing.score) {
        acc.set(current.candidateId, current);
      }
      return acc;
    }, new Map<string, any>());

    const uniqueMatches = Array.from(bestMatchesMap.values());

    // Sắp xếp và lấy Top N
    const topMatches = uniqueMatches
      .filter((m) => m.score >= 50)
      .sort((a, b) => b.score - a.score)
      .slice(0, (job.vacancies || 1) * 5);

    this.logger.log(`Đã tìm thấy ${topMatches.length} ứng viên duy nhất phù hợp cho Job ${jobId}`);
    return topMatches;
  }

  async runMatchingForCandidate(userId: string) {
    this.logger.log(`Bắt đầu chạy Matching cho User ID: ${userId}`);

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        cvs: {
          where: { parsedData: { not: Prisma.JsonNull } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!candidate || candidate.cvs.length === 0) {
      this.logger.warn(`Candidate không tồn tại hoặc không có CV đã phân tích.`);
      return [];
    }

    // Chọn CV chính hoặc CV mới nhất
    const mainCv = candidate.cvs.find(cv => cv.isMain) || candidate.cvs[0];
    const parsedData = mainCv.parsedData as any;
    const cvSkills = parsedData.skills || [];
    const cvExp = parsedData.totalYearsExp || 0;

    // Lấy tất cả Job đang mở (APPROVED) và có yêu cầu cấu trúc
    const allJobs = await this.prisma.jobPosting.findMany({
      where: {
        status: 'APPROVED',
        structuredRequirements: { not: Prisma.JsonNull }
      },
      include: { company: true }
    });

    const matches = allJobs.map((job) => {
      const reqs = job.structuredRequirements as any;
      const { hardSkills = [], softSkills = [], minExperienceYears = 0 } = reqs;

      // 1. Tính điểm Kỹ năng (60%)
      const matchedHard = hardSkills.filter((s: string) =>
        cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
        })
      );
      const hardScore = hardSkills.length > 0 ? (matchedHard.length / hardSkills.length) : 1;

      const matchedSoft = softSkills.filter((s: string) =>
        cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
        })
      );
      const softScore = softSkills.length > 0 ? (matchedSoft.length / softSkills.length) : 1;

      const skillScore = (hardScore * 0.8) + (softScore * 0.2);

      // 2. Tính điểm Kinh nghiệm (30%)
      let expScore = 1;
      if (minExperienceYears > 0) {
        expScore = Math.min(cvExp / minExperienceYears, 1.2);
      }

      // 3. Điểm tổng hợp
      let finalScore = (skillScore * 0.6) + (expScore * 0.4);

      // 4. Cộng thêm độ tin cậy nếu công ty đã xác thực MST (+15% điểm tin cậy)
      if (job.company && job.company.verifyStatus === 1) {
        finalScore += 0.15;
      }

      return {
        ...job,
        score: Math.min(Math.round(finalScore * 100), 100),
        matchedSkills: [...matchedHard, ...matchedSoft],
      };
    });

    // Sắp xếp và lấy Top
    return matches
      .filter((m) => m.score >= 40) // Ngưỡng thấp hơn tí cho ứng viên nhiều lựa chọn
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
  }
}
