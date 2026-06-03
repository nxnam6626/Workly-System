import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class LanguageStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(LanguageStrategy.name);

  // Bản đồ quy đổi các trình độ ngoại ngữ phổ biến
  private readonly languageLevels: Record<string, number> = {
    // English
    'ielts 9.0': 100, 'ielts 8.5': 95, 'ielts 8.0': 90, 'ielts 7.5': 85, 'ielts 7.0': 80,
    'ielts 6.5': 75, 'ielts 6.0': 70, 'ielts 5.5': 60, 'ielts 5.0': 50,
    'toeic 990': 100, 'toeic 900': 90, 'toeic 850': 85, 'toeic 800': 80, 'toeic 750': 75,
    'toeic 700': 70, 'toeic 650': 65, 'toeic 600': 60, 'toeic 500': 50,
    'c2': 100, 'c1': 90, 'b2': 75, 'b1': 60, 'a2': 40,
    // Japanese
    'n1': 100, 'jlpt n1': 100,
    'n2': 85, 'jlpt n2': 85,
    'n3': 70, 'jlpt n3': 70,
    'n4': 50, 'jlpt n4': 50,
    'n5': 30, 'jlpt n5': 30,
    // Chinese
    'hsk 6': 100, 'hsk6': 100,
    'hsk 5': 85, 'hsk5': 85,
    'hsk 4': 70, 'hsk4': 70,
    'hsk 3': 50, 'hsk3': 50,
    // Korean
    'topik 6': 100, 'topik 5': 85, 'topik 4': 70, 'topik 3': 55, 'topik 2': 40,
    
    // General
    'advanced': 80, 'thành thạo': 80, 'cao cấp': 80,
    'intermediate': 60, 'trung cấp': 60, 'khá': 60,
    'beginner': 40, 'cơ bản': 40, 'sơ cấp': 40, 'giao tiếp': 50,
  };

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const requiredLang = job.structuredRequirements?.languages || [];
      const parsedCvLangs = cv.parsedData?.languages || [];
      const candidateLangs = (cv.candidate?.languages as any[]) || [];
      const cvLangs = candidateLangs.length > 0 ? candidateLangs : parsedCvLangs;
      
      const candidateCerts = cv.candidate?.certifications || [];
      
      // Gộp chung danh sách ngoại ngữ và chứng chỉ của ứng viên
      const combinedLangsAndCerts = [...cvLangs, ...candidateCerts];

      if (requiredLang.length === 0)
        return {
          score: 100,
          details: {
            requiredLang: [],
            cvLangs: combinedLangsAndCerts,
            message: 'Không yêu cầu ngoại ngữ',
          },
        };

      // Tìm kiếm sự tương đồng trình độ
      let totalScore = 0;
      for (const req of requiredLang) {
        // req có thể là chuỗi "Tiếng Trung HSK 5" hoặc object {language: "Tiếng Trung", level: "HSK 5"}
        const reqStr = typeof req === 'string' 
          ? req.toLowerCase() 
          : `${req.language || ''} ${req.level || ''}`.toLowerCase();
          
        const foundLevel = this.matchLevel(reqStr, combinedLangsAndCerts);
        totalScore += foundLevel;
      }

      // Option C: Chứng chỉ ngoại ngữ hệ số xác minh
      const langKeywords = [
        'ielts', 'toeic', 'toefl', 'hsk', 'jlpt', 'topik', 'english',
        'tiếng anh', 'tiếng nhật', 'tiếng trung', 'tiếng hàn', 'tiếng pháp', 'tiếng đức',
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
        score: Math.round(score),
        details: {
          requiredLang,
          cvLangs: combinedLangsAndCerts,
          langMultiplier,
          verificationStatus,
        },
      };
    } catch (error: any) {
      this.logger.error(`Language Match Error: ${error.message}`);
      return { score: 100, details: {} };
    }
  }

  private matchLevel(req: string, combinedItems: any[]): number {
    let maxScore = 0;

    for (const item of combinedItems) {
      const itemStr = `${item.language || ''} ${item.name || ''} ${item.level || ''} ${item.certificate || ''} ${item.score || ''}`.toLowerCase();

      // Kiểm tra nếu item này khớp chính xác mức độ với yêu cầu
      for (const [key, val] of Object.entries(this.languageLevels)) {
        if (itemStr.includes(key) && req.includes(key)) {
          maxScore = Math.max(maxScore, 100);
        }
        if (
          itemStr.includes(key) &&
          this.languageLevels[key] >= this.getLevelFromStr(req) && 
          this.getLevelFromStr(req) > 0
        ) {
          maxScore = Math.max(maxScore, 100);
        }
      }

      // Nếu req chỉ yêu cầu ngôn ngữ chung chung (VD: "tiếng anh"), mà ứng viên có chứng chỉ/ngôn ngữ này
      if (this.getLevelFromStr(req) === 0 && req.length > 0) {
         if (itemStr.includes(req)) {
            maxScore = Math.max(maxScore, 100);
         }
      }
    }
    return maxScore;
  }

  private getLevelFromStr(str: string): number {
    for (const [key, val] of Object.entries(this.languageLevels)) {
      if (str.includes(key)) return val;
    }
    return 0;
  }
}
