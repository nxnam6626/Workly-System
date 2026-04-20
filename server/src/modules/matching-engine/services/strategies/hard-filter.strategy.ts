import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class HardFilterStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(HardFilterStrategy.name);

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = (cv.parsedData as any) || {};
      
      // 1. Kiểm tra Địa điểm (Location)
      const candLocation = (parsedCv.location || '').toLowerCase();
      const jobLocation = (job.locationCity || '').toLowerCase();
      
      let locationScore = 100;
      if (jobLocation && candLocation && !candLocation.includes(jobLocation) && !jobLocation.includes(candLocation)) {
        // Sai thành phố: Hình phạt cực đoan (Extreme Penalty) -> trừ 100 điểm location
        locationScore = 0; 
      }

      // 2. Kiểm tra Lương (Salary)
      const expectedSalary = parsedCv.expectedSalary || 0;
      const salaryMax = Number(job.salaryMax) || 0;
      
      let salaryScore = 100;
      if (salaryMax > 0 && expectedSalary > salaryMax) {
        // Lương vượt ngân sách: Trừ điểm theo tỷ lệ vượt quá
        const ratio = expectedSalary / salaryMax;
        salaryScore = Math.max(40, 100 - (ratio - 1) * 100);
      }

      const finalScore = (locationScore * 0.5) + (salaryScore * 0.5);

      return {
        score: finalScore,
        details: {
          locationScore,
          salaryScore,
          candLocation,
          jobLocation,
          expectedSalary,
          salaryMax
        }
      };
    } catch (error) {
      this.logger.error(`HardFilter Match Error: ${error.message}`);
      return { score: 100 }; // Quay về mặc định nếu lỗi để không chặn ứng viên
    }
  }
}
