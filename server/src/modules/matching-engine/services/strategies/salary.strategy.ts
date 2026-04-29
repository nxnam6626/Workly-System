import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class SalaryStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(SalaryStrategy.name);

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = (cv.parsedData as any) || {};
      const profileSalaryStr = cv.candidate?.desiredJob?.salary || '';
      const expectedSalary = profileSalaryStr ? this.parseSalary(profileSalaryStr) : (parsedCv.expectedSalary || 0);
      const salaryMax = Number(job.salaryMax) || 0;
      
      let score = 100;
      if (salaryMax > 0 && expectedSalary > salaryMax) {
        // Lương vượt ngân sách: Trừ điểm theo tỷ lệ vượt quá
        const ratio = expectedSalary / salaryMax;
        // Điểm phản ánh mức độ vượt quá. Ví dụ vượt 20% -> score = 80
        score = Math.max(0, 100 - (ratio - 1) * 100);
      }

      return {
        score,
        details: {
          expectedSalary,
          salaryMax,
          isOverBudget: expectedSalary > salaryMax
        }
      };
    } catch (error) {
      this.logger.error(`Salary Match Error: ${error.message}`);
      return { score: 100 };
    }
  }

  private parseSalary(salaryStr: string): number {
    // Loại bỏ các ký tự không phải số (VND, dấu chấm, dấu phẩy, khoảng trắng)
    const normalized = salaryStr.replace(/[^0-9]/g, '');
    return Number(normalized) || 0;
  }
}
