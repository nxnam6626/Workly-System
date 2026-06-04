import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class EducationStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(EducationStrategy.name);

  // Thang điểm cấp bậc bằng cấp
  private readonly degreeMap: Record<string, number> = {
    phd: 100,
    doctor: 100,
    'tiến sĩ': 100,
    'tiến sỹ': 100,
    'dr.': 100,
    master: 85,
    'thạc sĩ': 85,
    'thạc sỹ': 85,
    bachelor: 70,
    'đại học': 70,
    'cử nhân': 70,
    'kỹ sư': 70,
    'ky su': 70,
    engineer: 70,
    undergraduate: 70,
    associate: 50,
    'cao đẳng': 50,
    college: 50,
    'high school': 30,
    'trung học': 30,
    thpt: 30,
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = cv.parsedData || {};
      const structuredJob = job.structuredRequirements || {};

      // Tìm bằng cấp cao nhất trong danh sách degrees của candidate
      const candidateDegrees = cv.candidate?.degrees || [];
      let highestDegreeName = 'none';
      let highestDegreeLevel = 0;

      for (const d of candidateDegrees) {
        const dName = (d.name || '').toLowerCase();
        const dLevel = this.getDegreeLevel(dName);
        if (dLevel > highestDegreeLevel) {
          highestDegreeLevel = dLevel;
          highestDegreeName = d.name;
        }
      }

      const candidateDegree = (
        highestDegreeName !== 'none'
          ? highestDegreeName
          : (cv.candidate?.degree || parsedCv.education?.level || 'none')
      ).toLowerCase();
      const requiredDegree = (
        structuredJob.minEducation || 'none'
      ).toLowerCase();

      const candidateMajor = cv.candidate?.major || parsedCv.education?.major || '';
      const requiredMajor = structuredJob.requiredMajor || '';

      const certifications = (cv.candidate?.certifications || []).map(
        (c: any) => c.name.toLowerCase(),
      );

      // 1. Chấm điểm cấp bậc (60% tỷ trọng strategy)
      let candLevel = this.getDegreeLevel(candidateDegree);

      // Nếu không có bằng cấp chính quy, kiểm tra chứng chỉ
      if (candLevel < 50 && certifications.length > 0) {
        candLevel = 40; // Có chứng chỉ nghề nghiệp tương đương Associate/Cao đẳng nhẹ
      }

      const reqLevel = this.getDegreeLevel(requiredDegree);

      let levelScore = 0;
      if (reqLevel === 0) {
        levelScore = 100;
      } else if (candLevel >= reqLevel) {
        levelScore = 100;
      } else {
        levelScore = Math.max(10, (candLevel / reqLevel) * 100);
      }

      // 2. Chấm điểm chuyên ngành & GPA (40% tỷ trọng strategy)
      let majorScore = 0;
      const normCandidateMajor = this.normalizeForMatch(candidateMajor);
      const normRequiredMajor = this.normalizeForMatch(requiredMajor);

      const isMajorMatch =
        !normRequiredMajor ||
        normCandidateMajor.includes(normRequiredMajor) ||
        normRequiredMajor.includes(normCandidateMajor);

      if (isMajorMatch) {
        majorScore = 100;
      } else {
        majorScore = 40;
      }

      // Bonus điểm GPA nếu có (tối đa +10 điểm vào majorScore)
      const gpa = parseFloat(
        cv.candidate?.gpa || parsedCv.education?.gpa || '0',
      );
      if (gpa > 3.2) majorScore = Math.min(100, majorScore + 10);

      // Option C: Bằng cấp xác minh hệ số
      let eduMultiplier = 0.3; // Mặc định chưa nộp minh chứng
      let verificationStatus = 'UNVERIFIED';

      if (candidateDegrees.length > 0) {
        const statuses = candidateDegrees.map((d: any) => d.status);
        if (statuses.includes('VERIFIED')) {
          eduMultiplier = 1.0;
          verificationStatus = 'VERIFIED';
        } else if (statuses.includes('PENDING')) {
          eduMultiplier = 0.8;
          verificationStatus = 'PENDING';
        }
      }

      const finalScore = (levelScore * 0.6 + majorScore * 0.4) * eduMultiplier;

      return {
        score: finalScore,
        details: {
          levelScore,
          majorScore,
          eduMultiplier,
          verificationStatus,
          candidateDegree:
            highestDegreeName !== 'none'
              ? highestDegreeName
              : (parsedCv.education?.level || 'Chưa cập nhật'),
          requiredDegree: structuredJob.minEducation || 'Không yêu cầu',
          university:
            cv.candidate?.university || parsedCv.education?.school || 'N/A',
          major: cv.candidate?.major || parsedCv.education?.major || 'N/A',
          gpa: gpa || 0,
        },
      };
    } catch (error) {
      this.logger.error(`Education Match Error: ${error.message}`);
      return { score: 0 };
    }
  }

  private getDegreeLevel(degree: string): number {
    for (const [key, value] of Object.entries(this.degreeMap)) {
      if (degree.includes(key)) return value;
    }
    return 0;
  }

  private removeDiacritics(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
  }

  private normalizeForMatch(str: string): string {
    const withoutDiacritics = this.removeDiacritics(str);
    return withoutDiacritics
      .toLowerCase()
      .replace(/[-–—/\\,_+&]/g, ' ') // Replace common separators with spaces
      .replace(/\s+/g, ' ')          // Collapse multiple spaces
      .trim();
  }
}
