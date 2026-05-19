import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class SalaryStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(SalaryStrategy.name);

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedCv = cv.parsedData || {};
      const desiredJob = cv.candidate?.desiredJob as any;
      const profileSalaryStr = desiredJob?.expectedSalary || desiredJob?.salary || '';
      const cvExpectedStr = typeof parsedCv.expectedSalary === 'string' ? parsedCv.expectedSalary : '';
      const rawExpected = profileSalaryStr || cvExpectedStr;
      
      const expectedSalary = rawExpected
        ? this.parseSalary(rawExpected)
        : (Number(parsedCv.expectedSalary) || 0);
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
          isOverBudget: expectedSalary > salaryMax,
        },
      };
    } catch (error) {
      this.logger.error(`Salary Match Error: ${error.message}`);
      return { score: 100 };
    }
  }

  private parseSalary(salaryStr: string): number {
    if (!salaryStr) return 0;
    // Nếu có dải lương (ví dụ: "15,000,000 - 20,000,000 VND")
    // Lấy phần tử đầu tiên (15,000,000) làm mức lương kỳ vọng tối thiểu
    const parts = salaryStr.split('-');
    const minSalaryPart = parts[0];
    
    // Loại bỏ các ký tự không phải số
    const normalized = minSalaryPart.replace(/[^0-9]/g, '');
    return Number(normalized) || 0;
  }
}
