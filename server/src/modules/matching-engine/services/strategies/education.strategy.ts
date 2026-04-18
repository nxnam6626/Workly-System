import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class EducationStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(EducationStrategy.name);

  // Thang điểm cấp bậc bằng cấp
  private readonly degreeMap: Record<string, number> = {
    'phd': 100,
    'doctor': 100,
    'master': 85,
    'thạc sĩ': 85,
    'bachelor': 70,
    'đại học': 70,
    'associate': 50,
    'cao đẳng': 50,
    'college': 50,
    'high school': 30,
    'trung học': 30,
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = (cv.parsedData as any) || {};
      const structuredJob = (job.structuredRequirements as any) || {};

      const candidateDegree = (parsedCv.education?.level || 'none').toLowerCase();
      const requiredDegree = (structuredJob.minEducation || 'none').toLowerCase();
      
      const candidateMajor = (parsedCv.education?.major || '').toLowerCase();
      const requiredMajor = (structuredJob.requiredMajor || '').toLowerCase();

      // 1. Chấm điểm cấp bậc (60% tỷ trọng strategy)
      const candLevel = this.getDegreeLevel(candidateDegree);
      const reqLevel = this.getDegreeLevel(requiredDegree);
      
      let levelScore = 0;
      if (reqLevel === 0) {
        levelScore = 100; // Không yêu cầu bằng cấp
      } else if (candLevel >= reqLevel) {
        levelScore = 100; // Đạt hoặc vượt chuẩn
      } else {
        levelScore = Math.max(0, (candLevel / reqLevel) * 100 - 20);
      }

      // 2. Chấm điểm chuyên ngành (40% tỷ trọng strategy)
      let majorScore = 0;
      if (!requiredMajor || candidateMajor.includes(requiredMajor) || requiredMajor.includes(candidateMajor)) {
        majorScore = 100;
      } else {
        // Có thể mở rộng dùng semantic similarity cho Major ở đây
        majorScore = 50; // Khác ngành nhưng vẫn có bằng cấp liên quan
      }

      const finalScore = (levelScore * 0.6) + (majorScore * 0.4);

      return {
        score: finalScore,
        details: {
          levelScore,
          majorScore,
          candidateDegree,
          requiredDegree
        }
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
}
