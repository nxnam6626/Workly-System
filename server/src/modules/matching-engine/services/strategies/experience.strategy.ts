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
      const candidateYears = parsedData.yearsOfExperience || 0;
      const requiredYears = parseInt(job.experience) || 0;

      // 1. Tính điểm Số năm kinh nghiệm (50% của Strategy này)
      let yearScore = 0;
      if (requiredYears === 0) {
        yearScore = 100;
      } else {
        const ratio = candidateYears / requiredYears;
        if (ratio < 1) {
          yearScore = Math.min(100, ratio * 100);
        } else if (ratio <= 2.5) {
          yearScore = 100;
        } else if (ratio <= 4) {
          yearScore = 85; // Overqualified penalty
        } else {
          yearScore = 70; // Highly overqualified penalty
        }
      }

      // 2. Tính điểm tương đồng Chức danh (50% của Strategy này)
      // Sử dụng SQL Vector similarity để so khớp Chức danh (nếu có embedding cho title)
      // Ở đây ta sử dụng một logic so khớp đơn giản hoặc Semantic Search nếu Title được lưu Vector
      // Tạm thời sử dụng logic so khớp text hoặc bạn có thể nâng cấp lên dùng Embedding Title riêng
      const titleMatchScore = this.calculateTitleSimilarity(job.title, cv.cvTitle || '');

      const finalScore = (yearScore * 0.4) + (titleMatchScore * 0.6);

      return {
        score: finalScore,
        details: {
          yearsScore: yearScore,
          titleScore: titleMatchScore,
          candidateYears,
          requiredYears
        }
      };
    } catch (error) {
      this.logger.error(`Experience Match Error: ${error.message}`);
      return { score: 0 };
    }
  }

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
