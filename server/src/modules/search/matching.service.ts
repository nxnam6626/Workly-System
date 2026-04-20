import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async runMatchingForJob(jobId: string) {
    this.logger.log(`Bắt đầu chạy Matching cho Job ID: ${jobId}`);

    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
    });

    if (!job || !job.structuredRequirements) {
      this.logger.warn(`Job không tồn tại hoặc không có yêu cầu cấu trúc.`);
      return [];
    }

    if (job.status === 'REJECTED') {
      this.logger.warn(`Job bị từ chối, không trả về gợi ý.`);
      return [];
    }

    const reqs = job.structuredRequirements as any;
    const hardSkills = Array.isArray(reqs?.hardSkills) ? reqs.hardSkills : [];
    const softSkills = Array.isArray(reqs?.softSkills) ? reqs.softSkills : [];
    const minExperienceYears = reqs?.minExperienceYears || 0;

    // Lấy tất cả CV đã được bóc tách và ở trạng thái PUBLISHED
    const allCvs = (await this.prisma.cV.findMany({
      where: {
        parsedData: { not: Prisma.JsonNull },
      },
      select: { candidateId: true, parsedData: true, cvId: true },
    })) as any[];

    const matches = allCvs.map((cv) => {
      const parsedData = cv.parsedData;
      const cvSkills = Array.isArray(parsedData?.skills) ? parsedData.skills : [];
      const cvExp = parsedData?.totalYearsExp || 0;

      // 1. Tính điểm Kỹ năng (60%)
      const expandedSkillsMap =
        typeof reqs.expandedSkills === 'object' && reqs.expandedSkills !== null
          ? reqs.expandedSkills
          : {};

      const matchedHard = hardSkills.filter((s: string) => {
        const synonyms = Array.isArray(expandedSkillsMap[s])
          ? expandedSkillsMap[s]
          : [];
        const searchTerms = [s, ...synonyms].map((t) =>
          typeof t === 'string' ? t.toLowerCase() : '',
        );

        return cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          if (!skillStr) return false;
          const cvs = skillStr.toLowerCase();
          return searchTerms.some((term) => term && cvs.includes(term));
        });
      });
      const hardScore =
        hardSkills.length > 0 ? matchedHard.length / hardSkills.length : 1;

      const matchedSoft = softSkills.filter((s: string) =>
        cvSkills.some((cs: any) => {
          const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
          return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
        }),
      );
      const softScore =
        softSkills.length > 0 ? matchedSoft.length / softSkills.length : 1;

      const skillScore = hardScore * 0.8 + softScore * 0.2;

      // 2. Tính điểm Kinh nghiệm (30%)
      let expScore = 1;
      if (minExperienceYears > 0) {
        expScore = Math.min(cvExp / minExperienceYears, 1.2);
      }

      // 3. Điểm tổng hợp
      const finalScore = skillScore * 0.6 + expScore * 0.4;

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

    // Sắp xếp và lấy Top N - Đồng bộ Threshold về 40
    const topMatches = uniqueMatches
      .filter((m) => m.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, (job.vacancies || 1) * 5);

    this.logger.log(
      `Đã tìm thấy ${topMatches.length} ứng viên phù hợp cho Job ${jobId}. Đang lưu vào DB...`,
    );

    // Xoá các match cũ của Job này
    await this.prisma.jobMatch.deleteMany({
      where: { jobPostingId: jobId },
    });

    // Thêm các match mới vào DB
    if (topMatches.length > 0) {
      await this.prisma.jobMatch.createMany({
        data: topMatches.map((m) => ({
          jobPostingId: jobId,
          candidateId: m.candidateId,
          score: m.score,
          matchedSkills: m.matchedSkills,
        })),
      });
    }

    return topMatches;
  }

  async runMatchingForCandidate(userId: string) {
    this.logger.log(`Bắt đầu chạy Matching cho User ID: ${userId}`);

    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        cvs: {
          where: { parsedData: { not: Prisma.JsonNull } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidate || candidate.cvs.length === 0) {
      this.logger.warn(
        `Candidate không tồn tại hoặc không có CV đã phân tích.`,
      );
      return [];
    }

    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    // Lấy tất cả Job đang mở (APPROVED) và có yêu cầu cấu trúc, loại bỏ job của chính mình
    const allJobs = await this.prisma.jobPosting.findMany({
      where: {
        status: 'APPROVED',
        structuredRequirements: { not: Prisma.JsonNull },
        ...(recruiter ? { NOT: { recruiterId: recruiter.recruiterId } } : {}),
      },
      include: { company: true },
    });

    const matches = allJobs.map((job) => {
      const parsedData = candidate.cvs.find((cv) => cv.isMain)?.parsedData || candidate.cvs[0].parsedData;
      const { score, matchedSkills } = this._calculateScore(
        job.structuredRequirements,
        parsedData,
        job.company?.verifyStatus === 1,
      );

      // Tính toán analysis data cho candidate
      const jobReqs = job.structuredRequirements as any;
      const hardSkills = Array.isArray(jobReqs?.hardSkills) ? jobReqs.hardSkills : [];
      const matchedHard = matchedSkills.filter(s => 
        hardSkills.some(hs => hs.toLowerCase() === s.toLowerCase())
      );
      const missingSkills = hardSkills.filter(s => 
        !matchedSkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()))
      );

      return {
        ...job,
        score,
        matchedSkills,
        missingSkills,
        analysis: {
          hardSkillsCount: hardSkills.length,
          matchedCount: matchedHard.length,
          missingCount: missingSkills.length,
          experienceMatch: (parsedData as any)?.totalYearsExp >= (jobReqs?.minExperienceYears || 0),
          totalYearsExp: (parsedData as any)?.totalYearsExp || 0,
          requiredExp: jobReqs?.minExperienceYears || 0
        }
      };
    });

    // Sắp xếp và lấy Top
    const topMatches = matches
      .filter((m) => m.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    this.logger.log(
      `Đã tìm thấy ${topMatches.length} Jobs phù hợp cho Candidate ${candidate.candidateId}. Đang lưu vào DB...`,
    );

    // Xoá các match cũ của Candidate này
    await this.prisma.jobMatch.deleteMany({
      where: { candidateId: candidate.candidateId },
    });

    // Thêm các match mới vào DB
    if (topMatches.length > 0) {
      await this.prisma.jobMatch.createMany({
        data: topMatches.map((m) => ({
          jobPostingId: m.jobPostingId,
          candidateId: candidate.candidateId,
          score: m.score,
          matchedSkills: m.matchedSkills,
        })),
      });
    }

    return topMatches;
  }

  /**
   * Logic tính điểm Matching dùng chung
   */
  private _calculateScore(
    structuredRequirements: any,
    parsedCvData: any,
    isCompanyVerified: boolean = false,
  ): { score: number; matchedSkills: string[] } {
    const reqs = structuredRequirements || {};
    const hardSkills = Array.isArray(reqs?.hardSkills) ? reqs.hardSkills : [];
    const softSkills = Array.isArray(reqs?.softSkills) ? reqs.softSkills : [];
    const minExperienceYears = reqs?.minExperienceYears || 0;
    const cvSkills = Array.isArray(parsedCvData?.skills) ? parsedCvData.skills : [];
    const cvExp = parsedCvData?.totalYearsExp || 0;

    // 1. Tính điểm Kỹ năng (60%)
    const expandedSkillsMap =
      typeof reqs.expandedSkills === 'object' && reqs.expandedSkills !== null
        ? reqs.expandedSkills
        : {};

    const matchedHard = hardSkills.filter((s: string) => {
      const synonyms = Array.isArray(expandedSkillsMap[s])
        ? expandedSkillsMap[s]
        : [];
      const searchTerms = [s, ...synonyms].map((t) =>
        typeof t === 'string' ? t.toLowerCase() : '',
      );

      return cvSkills.some((cs: any) => {
        const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
        if (!skillStr) return false;
        const cvs = skillStr.toLowerCase();
        return searchTerms.some((term) => term && cvs.includes(term));
      });
    });
    const hardScore =
      hardSkills.length > 0 ? matchedHard.length / hardSkills.length : 1;

    const matchedSoft = softSkills.filter((s: string) =>
      cvSkills.some((cs: any) => {
        const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
        return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
      }),
    );
    const softScore =
      softSkills.length > 0 ? matchedSoft.length / softSkills.length : 1;

    const skillScore = hardScore * 0.8 + softScore * 0.2;

    // 2. Tính điểm Kinh nghiệm (40%)
    let expScore = 1;
    if (minExperienceYears > 0) {
      expScore = Math.min(cvExp / minExperienceYears, 1.2);
    }

    // 3. Điểm tổng hợp
    let finalScore = skillScore * 0.6 + expScore * 0.4;

    // 4. Cộng thêm độ tin cậy nếu công ty đã xác thực (+15% điểm tin cậy)
    if (isCompanyVerified) {
      finalScore += 0.15;
    }

    return {
      score: Math.min(Math.round(finalScore * 100), 100),
      matchedSkills: [...matchedHard, ...matchedSoft],
    };
  }
}
