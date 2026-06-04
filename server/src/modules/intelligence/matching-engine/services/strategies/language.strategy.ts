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
      
      // Lọc các chứng chỉ liên quan đến ngoại ngữ
      const langKeywords = [
        'ielts', 'toeic', 'toefl', 'hsk', 'jlpt', 'topik', 'english',
        'tiếng anh', 'tiếng nhật', 'tiếng trung', 'tiếng hàn', 'tiếng pháp', 'tiếng đức',
      ];

      const langCerts = candidateCerts.filter((c: any) => {
        const nameLower = c.name.toLowerCase();
        return langKeywords.some((kw) => nameLower.includes(kw));
      });

      // Gộp chung danh sách ngoại ngữ và chứng chỉ ngoại ngữ của ứng viên
      const combinedLangsAndCerts = [...cvLangs, ...langCerts];

      if (requiredLang.length === 0) {
        const displayLangs = this.deduplicateLangs(combinedLangsAndCerts);
        return {
          score: 100,
          details: {
            requiredLang: [],
            cvLangs: displayLangs,
            message: 'Không yêu cầu ngoại ngữ',
          },
        };
      }

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
      const displayLangs = this.deduplicateLangs(combinedLangsAndCerts);

      return {
        score: Math.round(score),
        details: {
          requiredLang,
          cvLangs: displayLangs,
          langMultiplier,
          verificationStatus,
        },
      };
    } catch (error: any) {
      this.logger.error(`Language Match Error: ${error.message}`);
      return { score: 100, details: {} };
    }
  }

  private parseLanguageLevel(str: string): { type: string; value: number } {
    const s = str.toLowerCase();
    
    // 1. TOEIC
    if (s.includes('toeic')) {
      const match = s.match(/toeic\s*(\d+)/) || s.match(/(\d+)\s*toeic/);
      if (match) {
        return { type: 'toeic', value: parseInt(match[1], 10) };
      }
    }
    
    // 2. IELTS
    if (s.includes('ielts')) {
      const match = s.match(/ielts\s*(\d+(?:\.\d+)?)/) || s.match(/(\d+(?:\.\d+)?)\s*ielts/);
      if (match) {
        return { type: 'ielts', value: parseFloat(match[1]) };
      }
    }

    // 3. TOEFL
    if (s.includes('toefl')) {
      const match = s.match(/toefl\s*(\d+)/) || s.match(/(\d+)\s*toefl/);
      if (match) {
        return { type: 'toeic', value: parseInt(match[1], 10) };
      }
    }
    
    // 4. HSK
    if (s.includes('hsk')) {
      const match = s.match(/hsk\s*([1-6])/) || s.match(/([1-6])\s*hsk/);
      if (match) {
        return { type: 'hsk', value: parseInt(match[1], 10) };
      }
    }
    
    // 5. JLPT / N1-N5
    if (s.includes('jlpt') || /jlpt\s*n([1-5])/i.test(s) || /n([1-5])/i.test(s)) {
      const match = s.match(/jlpt\s*n([1-5])/) || s.match(/\bn([1-5])\b/) || s.match(/n([1-5])/);
      if (match) {
        const level = parseInt(match[1], 10);
        return { type: 'jlpt', value: 6 - level }; 
      }
    }
    
    // 6. TOPIK
    if (s.includes('topik')) {
      const match = s.match(/topik\s*([1-6])/) || s.match(/([1-6])\s*topik/);
      if (match) {
        return { type: 'topik', value: parseInt(match[1], 10) };
      }
    }

    // 7. CEFR
    const cefrMatch = s.match(/\b(c2|c1|b2|b1|a2|a1)\b/);
    if (cefrMatch) {
      const map: Record<string, number> = { a1: 1, a2: 2, b1: 3, b2: 4, c1: 5, c2: 6 };
      return { type: 'general', value: map[cefrMatch[1]] };
    }

    // General terms mapping
    if (s.includes('thành thạo') || s.includes('advanced') || s.includes('thanh thao') || s.includes('cao cấp') || s.includes('fluent')) {
      return { type: 'general', value: 5 };
    }
    if (s.includes('khá') || s.includes('intermediate') || s.includes('trung cấp') || s.includes('giao tiếp')) {
      return { type: 'general', value: 3.5 };
    }
    if (s.includes('cơ bản') || s.includes('beginner') || s.includes('sơ cấp') || s.includes('co ban')) {
      return { type: 'general', value: 1.5 };
    }
    
    return { type: 'unknown', value: 0 };
  }

  private mapToStandardScore(parsed: { type: string; value: number }): number {
    const { type, value } = parsed;
    if (type === 'toeic') {
      if (value >= 900) return 90 + ((value - 900) / 90) * 10;
      if (value >= 700) return 70 + ((value - 700) / 200) * 20;
      if (value >= 500) return 50 + ((value - 500) / 200) * 20;
      return Math.min(50, (value / 500) * 50);
    }
    if (type === 'ielts') {
      if (value >= 9.0) return 100;
      if (value >= 8.0) return 90 + ((value - 8.0) / 1.0) * 10;
      if (value >= 5.0) return 50 + ((value - 5.0) / 3.0) * 40;
      return Math.min(50, (value / 5.0) * 50);
    }
    if (type === 'hsk') {
      const map: Record<number, number> = { 1: 25, 2: 40, 3: 55, 4: 70, 5: 85, 6: 100 };
      return map[Math.round(value)] || 0;
    }
    if (type === 'jlpt') {
      const map: Record<number, number> = { 1: 30, 2: 50, 3: 70, 4: 85, 5: 100 };
      return map[Math.round(value)] || 0;
    }
    if (type === 'topik') {
      const map: Record<number, number> = { 1: 40, 2: 52, 3: 64, 4: 76, 5: 88, 6: 100 };
      return map[Math.round(value)] || 0;
    }
    if (type === 'general') {
      const map: Record<number, number> = { 1: 30, 2: 45, 3: 60, 4: 75, 5: 90, 6: 100 };
      return map[Math.round(value)] || 0;
    }
    return 0;
  }

  private matchLevel(req: string, combinedItems: any[]): number {
    const reqLower = req.toLowerCase();
    
    // Identify target language
    let targetLang: string | null = null;
    const languageKeywords: Record<string, string[]> = {
      english: ['english', 'tiếng anh', 'tieng anh', 'ielts', 'toeic', 'toefl', 'cefr', 'c1', 'c2', 'b1', 'b2'],
      japanese: ['japanese', 'tiếng nhật', 'tieng nhat', 'jlpt', 'n1', 'n2', 'n3', 'n4', 'n5'],
      chinese: ['chinese', 'tiếng trung', 'tieng trung', 'hsk', 'hoa ngữ'],
      korean: ['korean', 'tiếng hàn', 'tieng han', 'topik'],
      french: ['french', 'tiếng pháp', 'tieng phap', 'delf', 'dalf'],
      german: ['german', 'tiếng đức', 'tieng duc', 'goethe'],
    };

    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(kw => reqLower.includes(kw))) {
        targetLang = lang;
        break;
      }
    }

    if (!targetLang) {
      targetLang = 'english';
    }

    const reqParsed = this.parseLanguageLevel(reqLower);
    const reqStandardScore = this.mapToStandardScore(reqParsed);

    let maxScore = 0;

    for (const item of combinedItems) {
      const itemStr = `${item.language || ''} ${item.name || ''} ${item.level || ''} ${item.certificate || ''} ${item.score || ''}`.toLowerCase();

      const itemKeywords = languageKeywords[targetLang] || [];
      const isSameLanguage = itemKeywords.some(kw => itemStr.includes(kw));

      if (isSameLanguage) {
        const itemParsed = this.parseLanguageLevel(itemStr);
        const itemStandardScore = this.mapToStandardScore(itemParsed);

        if (reqStandardScore === 0) {
          maxScore = Math.max(maxScore, 100);
        } else if (itemStandardScore >= reqStandardScore) {
          maxScore = Math.max(maxScore, 100);
        } else {
          const ratioScore = (itemStandardScore / reqStandardScore) * 100;
          maxScore = Math.max(maxScore, Math.max(10, Math.round(ratioScore)));
        }
      }
    }
    return maxScore;
  }

  private deduplicateLangs(items: any[]): any[] {
    const uniqueItems: any[] = [];
    
    // Sắp xếp các phần tử theo độ dài chuỗi giảm dần để ưu tiên phần tử đầy đủ thông tin hơn
    const sortedItems = [...items].sort((a, b) => {
      const strA = `${a.language || a.name || ''} ${a.level || ''}`.trim();
      const strB = `${b.language || b.name || ''} ${b.level || ''}`.trim();
      return strB.length - strA.length;
    });

    for (const item of sortedItems) {
      const formatted = `${item.language || item.name || ''} ${item.level || ''}`.trim().toLowerCase();
      
      const isDuplicate = uniqueItems.some(ui => {
        const uiFormatted = `${ui.language || ui.name || ''} ${ui.level || ''}`.trim().toLowerCase();
        return uiFormatted.includes(formatted);
      });
      
      if (!isDuplicate) {
        uniqueItems.push(item);
      }
    }

    return uniqueItems;
  }
}
