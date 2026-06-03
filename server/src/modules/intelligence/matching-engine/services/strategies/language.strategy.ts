import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class LanguageStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(LanguageStrategy.name);

  // Bản đồ quy đổi các trình độ tiếng Anh phổ biến
  private readonly englishLevels: Record<string, number> = {
    'ielts 9.0': 100,
    'ielts 8.5': 95,
    'ielts 8.0': 90,
    'ielts 7.5': 85,
    'ielts 7.0': 80,
    'ielts 6.5': 75,
    'ielts 6.0': 70,
    'ielts 5.5': 60,
    'ielts 5.0': 50,
    'toeic 990': 100,
    'toeic 900': 90,
    'toeic 850': 85,
    'toeic 800': 80,
    'toeic 750': 75,
    'toeic 700': 70,
    'toeic 650': 65,
    'toeic 600': 60,
    'toeic 500': 50,
    b2: 75,
    c1: 90,
    c2: 100,
    a2: 40,
    b1: 60,
    advanced: 80,
    intermediate: 60,
    beginner: 40,
    'thành thạo': 80,
    'trung cấp': 60,
    'cơ bản': 40,
    'sơ cấp': 40,
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const requiredLang = job.structuredRequirements?.languages || [];
      const parsedCvLangs = cv.parsedData?.languages || [];
      const candidateLangs = (cv.candidate?.languages as any[]) || [];
      const cvLangs =
        candidateLangs.length > 0 ? candidateLangs : parsedCvLangs;

      if (requiredLang.length === 0)
        return {
          score: 100,
          details: {
            requiredLang: [],
            cvLangs,
            message: 'Không yêu cầu ngoại ngữ',
          },
        };

      // Tìm kiếm sự tương đồng trình độ
      let totalScore = 0;
      for (const req of requiredLang) {
        const reqStr = `${req.language} ${req.level}`.toLowerCase();
        const foundLevel = this.matchLevel(reqStr, cvLangs);
        totalScore += foundLevel;
      }

      // Option C: Chứng chỉ ngoại ngữ hệ số xác minh
      const candidateCerts = cv.candidate?.certifications || [];
      const langKeywords = [
        'ielts',
        'toeic',
        'toefl',
        'hsk',
        'jlpt',
        'topik',
        'english',
        'tiếng anh',
        'tiếng nhật',
        'tiếng trung',
        'tiếng hàn',
        'tiếng pháp',
        'tiếng đức',
      ];

      const langCerts = candidateCerts.filter((c: any) => {
        const nameLower = c.name.toLowerCase();
        return langKeywords.some((kw) => nameLower.includes(kw));
      });

      let langMultiplier = 0.3; // Mặc định chưa nộp minh chứng
      let verificationStatus = 'UNVERIFIED';

      if (langCerts.length > 0) {
        const statuses = langCerts.map((c: any) => c.status);
        if (statuses.includes('VERIFIED')) {
          langMultiplier = 1.0;
          verificationStatus = 'VERIFIED';
        } else if (statuses.includes('PENDING')) {
          langMultiplier = 0.8;
          verificationStatus = 'PENDING';
        }
      }

      const score = (totalScore / requiredLang.length) * langMultiplier;

      return {
        score,
        details: {
          requiredLang,
          cvLangs,
          langMultiplier,
          verificationStatus,
        },
      };
    } catch (error) {
      this.logger.error(`Language Match Error: ${error.message}`);
      return { score: 100 };
    }
  }

  private matchLevel(req: string, cvLangs: any[]): number {
    // Logic tìm kiếm trình độ tương đương trong danh sách ngoại ngữ của ứng viên
    for (const cvLang of cvLangs) {
      const cvStr =
        `${cvLang.language || cvLang.name || ''} ${cvLang.level || ''} ${cvLang.certificate || ''} ${cvLang.score || ''}`.toLowerCase();

      // Nếu khớp chính xác từ khóa trình độ
      for (const [key, val] of Object.entries(this.englishLevels)) {
        if (cvStr.includes(key) && req.includes(key)) return 100;
        if (
          cvStr.includes(key) &&
          this.englishLevels[key] >= this.getLevelFromStr(req)
        )
          return 100;
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
