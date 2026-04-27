import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class LanguageStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(LanguageStrategy.name);

  // Bản đồ quy đổi các trình độ tiếng Anh phổ biến
  private readonly englishLevels: Record<string, number> = {
    'ielts 9.0': 100, 'ielts 8.5': 95, 'ielts 8.0': 90, 'ielts 7.5': 85, 'ielts 7.0': 80, 'ielts 6.5': 75, 'ielts 6.0': 70, 'ielts 5.5': 60, 'ielts 5.0': 50,
    'toeic 990': 100, 'toeic 900': 90, 'toeic 850': 85, 'toeic 800': 80, 'toeic 750': 75, 'toeic 700': 70, 'toeic 650': 65, 'toeic 600': 60, 'toeic 500': 50,
    'b2': 75, 'c1': 90, 'c2': 100, 'a2': 40, 'b1': 60,
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const requiredLang = job.structuredRequirements?.languages || [];
      const cvLangs = cv.parsedData?.languages || [];

      if (requiredLang.length === 0) return { score: 100 };

      // Tìm kiếm sự tương đồng trình độ
      let totalScore = 0;
      for (const req of requiredLang) {
        const reqStr = `${req.language} ${req.level}`.toLowerCase();
        const foundLevel = this.matchLevel(reqStr, cvLangs);
        totalScore += foundLevel;
      }

      const score = totalScore / requiredLang.length;

      return {
        score,
        details: { requiredLang, cvLangs }
      };
    } catch (error) {
      this.logger.error(`Language Match Error: ${error.message}`);
      return { score: 100 };
    }
  }

  private matchLevel(req: string, cvLangs: any[]): number {
    // Logic tìm kiếm trình độ tương đương trong danh sách ngoại ngữ của ứng viên
    for (const cvLang of cvLangs) {
      const cvStr = `${cvLang.language} ${cvLang.level || cvLang.certificate}`.toLowerCase();
      
      // Nếu khớp chính xác từ khóa trình độ
      for (const [key, val] of Object.entries(this.englishLevels)) {
        if (cvStr.includes(key) && req.includes(key)) return 100;
        if (cvStr.includes(key) && this.englishLevels[key] >= this.getLevelFromStr(req)) return 100;
      }
    }
    return 0;
  }

  private getLevelFromStr(str: string): number {
    for (const [key, val] of Object.entries(this.englishLevels)) {
      if (str.includes(key)) return val;
    }
    return 0;
  }
}
