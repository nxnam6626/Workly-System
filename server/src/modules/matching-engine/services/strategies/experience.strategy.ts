import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';
import { PrismaService } from '../../../../prisma/prisma.service';

@Injectable()
export class ExperienceStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(ExperienceStrategy.name);

  constructor(private readonly prisma: PrismaService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const parsedData = (cv.parsedData as any) || {};
      const candidateYears = cv.candidate?.totalYearsExp ?? parsedData.yearsOfExperience ?? 0;
      const requiredYears = parseInt(job.experience) || 0;

      // 1. Tính điểm Số năm kinh nghiệm (100% của Strategy này)
      let yearScore = 0;
      if (requiredYears === 0) {
        yearScore = 100;
      } else {
        const ratio = candidateYears / requiredYears;
        if (ratio >= 1) {
          yearScore = 100; // Đạt hoặc vượt yêu cầu
        } else {
          // Nếu thiếu năm, tính điểm theo tỷ lệ nhưng tối thiểu 10 điểm nếu có kinh nghiệm
          yearScore = Math.max(10, Math.round(ratio * 100));
        }
      }

      return {
        score: yearScore,
        details: {
          yearsScore: yearScore,
          candidateYears,
          requiredYears
        }
      };
    } catch (error) {
      this.logger.error(`Experience Match Error: ${error.message}`);
      return { score: 0 };
    }
  }

  // Phương thức này giờ không còn được gọi từ calculate để tránh dư thừa
  private calculateTitleSimilarity(jobTitle: string, cvTitle: string): number {
    const jt = jobTitle.toLowerCase();
    const ct = cvTitle.toLowerCase();
    
    if (jt === ct) return 100;
    
    // Logic so khớp từ khóa cơ bản (Có thể nâng cấp lên Embedding Title ở Giai đoạn sau)
    const jobWords = jt.split(' ');
    const matchedWords = jobWords.filter(word => word.length > 2 && ct.includes(word));
    
    const rate = matchedWords.length / jobWords.length;
    return Math.min(100, Math.round(rate * 100) + 40); // Base score 40 if some words match
  }
}
