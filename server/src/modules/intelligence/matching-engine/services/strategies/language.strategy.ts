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
      const requiredLang = [...(job.structuredRequirements?.languages || [])];
      
      // 1. Trích xuất yêu cầu ẩn từ mảng kỹ năng nếu requiredLang rỗng
      if (requiredLang.length === 0) {
        const allSkills = [
          ...(job.structuredRequirements?.hardSkills || []),
          ...(job.structuredRequirements?.softSkills || []),
        ];
        const langKeywords = [
          'ngoại ngữ', 'tiếng anh', 'tiếng nhật', 'tiếng trung', 'tiếng hàn', 'tiếng pháp', 'tiếng đức',
          'english', 'japanese', 'chinese', 'korean', 'french', 'german',
          'toeic', 'ielts', 'toefl', 'hsk', 'jlpt', 'topik',
        ];

        for (const skill of allSkills) {
          const skillLower = typeof skill === 'string' ? skill.toLowerCase() : (skill.skillName || '').toLowerCase();
          if (langKeywords.some((kw) => skillLower.includes(kw))) {
            requiredLang.push(typeof skill === 'string' ? skill : skill.skillName);
          }
        }
      }

      const parsedCvLangs = cv.parsedData?.languages || [];
      const candidateLangs = (cv.candidate?.languages as any[]) || [];
      const cvLangs = candidateLangs.length > 0 ? candidateLangs : parsedCvLangs;
      
      const candidateCerts = cv.candidate?.certifications || [];
      
      // Lọc các chứng chỉ liên quan đến ngoại ngữ
      const langCertKeywords = [
        'ielts', 'toeic', 'toefl', 'hsk', 'jlpt', 'topik', 'english',
        'tiếng anh', 'tiếng nhật', 'tiếng trung', 'tiếng hàn', 'tiếng pháp', 'tiếng đức',
      ];

      const langCerts = candidateCerts.filter((c: any) => {
        const nameLower = (c.name || '').toLowerCase();
        return langCertKeywords.some((kw) => nameLower.includes(kw));
      });

      // Gộp chung danh sách ngoại ngữ và chứng chỉ ngoại ngữ của ứng viên
      const combinedLangsAndCerts = [...cvLangs, ...langCerts];
      const displayLangs = this.deduplicateLangs(combinedLangsAndCerts);

      // Nhóm ứng viên theo từng ngôn ngữ để tính Bonus
      const candidateLangsMap = new Map<string, any[]>();
      for (const item of combinedLangsAndCerts) {
        const itemStr = `${item.language || ''} ${item.name || ''} ${item.level || ''} ${item.certificate || ''} ${item.score || ''}`.toLowerCase();
        const targetLang = this.detectLanguage(itemStr);
        if (!candidateLangsMap.has(targetLang)) {
          candidateLangsMap.set(targetLang, []);
        }
        candidateLangsMap.get(targetLang)!.push(item);
      }

      // Xử lý trường hợp hoàn toàn không có yêu cầu ngoại ngữ
      if (requiredLang.length === 0) {
        let bonusScore = 0;
        let verificationStatuses: string[] = [];
        
        for (const [lang, items] of candidateLangsMap.entries()) {
          if (lang !== 'unknown_lang') {
            const best = this.findBestScoreForLanguage(items);
            // Thưởng 15% cho 1 ngoại ngữ max level, quy đổi theo điểm chuẩn
            bonusScore += (best.score / 100) * 15 * best.multiplier;
            if (best.matchedItem) {
              verificationStatuses.push(best.matchedItem.status || 'UNVERIFIED');
            }
          }
        }
        
        // Không yêu cầu nhưng tự có = Base 100 + Bonus
        const finalScore = Math.min(100 + bonusScore, 120); 

        return {
          score: Math.round(finalScore),
          details: {
            requiredLang: [],
            cvLangs: displayLangs,
            message: 'Không yêu cầu ngoại ngữ',
            verificationStatus: this.aggregateVerificationStatus(verificationStatuses),
          },
        };
      }

      // 2. Tính Base Score cho các yêu cầu
      let totalBaseWeighted = 0;
      let targetLangsRequired = new Set<string>();
      let verificationStatuses: string[] = [];

      for (const req of requiredLang) {
        const reqStr = typeof req === 'string' 
          ? req.toLowerCase() 
          : `${req.language || ''} ${req.level || ''}`.toLowerCase();
          
        const match = this.calculateLanguageMatch(reqStr, combinedLangsAndCerts);
        targetLangsRequired.add(match.targetLang);
        
        totalBaseWeighted += (match.score * match.multiplier);
        
        if (match.matchedItem) {
          verificationStatuses.push(match.matchedItem.status || 'UNVERIFIED');
        } else {
          verificationStatuses.push('MISSING');
        }
      }

      const baseScore = totalBaseWeighted / requiredLang.length;

      // 3. Tính Bonus Score cho các ngoại ngữ bổ sung
      let bonusScore = 0;
      for (const [lang, items] of candidateLangsMap.entries()) {
        if (lang !== 'unknown_lang' && !targetLangsRequired.has(lang)) {
          const best = this.findBestScoreForLanguage(items);
          // Bonus max 15% per extra language
          bonusScore += (best.score / 100) * 15 * best.multiplier;
          if (best.matchedItem) {
            verificationStatuses.push(best.matchedItem.status || 'UNVERIFIED');
          }
        }
      }

      // 4. Áp dụng quy tắc Capping
      let finalScore = baseScore + bonusScore;
      if (baseScore < 100 && finalScore > 95) {
        // Nếu điểm nền chưa đạt 100%, tổng điểm không được phép vượt quá 95%
        // Để đảm bảo không bao giờ bằng điểm người đạt 100% yêu cầu
        finalScore = Math.max(baseScore, 95);
      }

      return {
        score: Math.round(finalScore),
        details: {
          requiredLang,
          cvLangs: displayLangs,
          baseScore: Math.round(baseScore),
          bonusScore: Math.round(bonusScore),
          verificationStatus: this.aggregateVerificationStatus(verificationStatuses),
        },
      };
    } catch (error: any) {
      this.logger.error(`Language Match Error: ${error.message}`);
      return { score: 100, details: {} };
    }
  }

  // Lấy điểm chuẩn cao nhất của 1 ngôn ngữ từ danh sách item
  private findBestScoreForLanguage(items: any[]): { score: number; multiplier: number; matchedItem: any } {
    let bestWeighted = -1;
    let best = { score: 0, multiplier: 0.5, matchedItem: null };

    for (const item of items) {
      const itemStr = `${item.language || ''} ${item.name || ''} ${item.level || ''} ${item.certificate || ''} ${item.score || ''}`.toLowerCase();
      const itemParsed = this.parseLanguageLevel(itemStr);
      let score = this.mapToStandardScore(itemParsed);
      if (score === 0) score = 50; // Mức cơ bản mặc định nếu có ghi tên ngoại ngữ

      const multiplier = this.getVerificationMultiplier(item);
      const weighted = score * multiplier;

      if (weighted > bestWeighted) {
        bestWeighted = weighted;
        best = { score, multiplier, matchedItem: item };
      }
    }
    return best;
  }

  private calculateLanguageMatch(reqStr: string, combinedItems: any[]): { score: number, multiplier: number, targetLang: string, matchedItem: any } {
    const targetLang = this.detectLanguage(reqStr);
    const reqParsed = this.parseLanguageLevel(reqStr);
    const reqStandardScore = this.mapToStandardScore(reqParsed);

    let maxWeighted = -1;
    let bestMatch = { score: 0, multiplier: 0.5, targetLang, matchedItem: null };

    for (const item of combinedItems) {
      const itemStr = `${item.language || ''} ${item.name || ''} ${item.level || ''} ${item.certificate || ''} ${item.score || ''}`.toLowerCase();
      const itemTargetLang = this.detectLanguage(itemStr);

      if (itemTargetLang === targetLang) {
        const itemParsed = this.parseLanguageLevel(itemStr);
        const itemStandardScore = this.mapToStandardScore(itemParsed);
        
        let score = 0;
        if (reqStandardScore === 0 || itemStandardScore >= reqStandardScore) {
          score = 100;
        } else {
          score = Math.max(10, Math.round((itemStandardScore / reqStandardScore) * 100));
        }

        const multiplier = this.getVerificationMultiplier(item);
        const weighted = score * multiplier;

        if (weighted > maxWeighted) {
          maxWeighted = weighted;
          bestMatch = { score, multiplier, targetLang, matchedItem: item };
        }
      }
    }
    return bestMatch;
  }

  private getVerificationMultiplier(item: any): number {
    const status = item?.status;
    if (status === 'VERIFIED') return 1.0;
    if (status === 'REJECTED') return 0.0;
    // PENDING (có nộp minh chứng) hoặc UNVERIFIED (chưa nộp / tự khai báo trong CV)
    if (status === 'PENDING' || status === 'UNVERIFIED' || !status) return 0.5;
    return 0.5; 
  }

  private aggregateVerificationStatus(statuses: string[]): string {
    if (statuses.length === 0 || statuses.every(s => s === 'MISSING')) return 'UNVERIFIED';
    if (statuses.includes('VERIFIED')) return 'VERIFIED';
    if (statuses.includes('PENDING')) return 'PENDING';
    return 'UNVERIFIED';
  }

  private detectLanguage(itemStr: string): string {
    const languageKeywords: Record<string, string[]> = {
      english: ['english', 'tiếng anh', 'tieng anh', 'ielts', 'toeic', 'toefl', 'cefr', 'c1', 'c2', 'b1', 'b2'],
      japanese: ['japanese', 'tiếng nhật', 'tieng nhat', 'jlpt', 'n1', 'n2', 'n3', 'n4', 'n5'],
      chinese: ['chinese', 'tiếng trung', 'tieng trung', 'hsk', 'hoa ngữ'],
      korean: ['korean', 'tiếng hàn', 'tieng han', 'topik'],
      french: ['french', 'tiếng pháp', 'tieng phap', 'delf', 'dalf'],
      german: ['german', 'tiếng đức', 'tieng duc', 'goethe'],
    };
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(kw => itemStr.includes(kw))) {
        return lang;
      }
    }
    return 'unknown_lang';
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

  private deduplicateLangs(items: any[]): any[] {
    const uniqueItems: any[] = [];
    
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
