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

      const candidateDegree = (cv.candidate?.degree || parsedCv.education?.level || 'none').toLowerCase();
      const requiredDegree = (structuredJob.minEducation || 'none').toLowerCase();
      
      const candidateMajor = (cv.candidate?.major || parsedCv.education?.major || '').toLowerCase();
      const requiredMajor = (structuredJob.requiredMajor || '').toLowerCase();

      const certifications = (cv.candidate?.certifications || []).map((c: any) => c.name.toLowerCase());

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
      const isMajorMatch = !requiredMajor || candidateMajor.includes(requiredMajor) || requiredMajor.includes(candidateMajor);
      
      if (isMajorMatch) {
        majorScore = 100;
      } else {
        majorScore = 40; 
      }

      // Bonus điểm GPA nếu có (tối đa +10 điểm vào majorScore)
      const gpa = parseFloat(cv.candidate?.gpa || parsedCv.education?.gpa || '0');
      if (gpa > 3.2) majorScore = Math.min(100, majorScore + 10);

      const finalScore = (levelScore * 0.6) + (majorScore * 0.4);

      return {
        score: finalScore,
        details: {
          levelScore,
          majorScore,
          candidateDegree: cv.candidate?.degree || parsedCv.education?.level || 'Chưa cập nhật',
          requiredDegree: structuredJob.minEducation || 'Không yêu cầu',
          university: cv.candidate?.university || parsedCv.education?.school || 'N/A',
          major: cv.candidate?.major || parsedCv.education?.major || 'N/A',
          gpa: gpa || 0
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
