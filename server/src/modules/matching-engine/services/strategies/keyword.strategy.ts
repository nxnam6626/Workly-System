import { Injectable } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class KeywordStrategy implements IMatchingStrategy {
  /**
   * Tính điểm dựa trên sự trùng lặp từ khóa (Kỹ năng, Công cụ)
   */
  async calculate(jobProps: any, cvProps: any): Promise<MatchingResult> {
    const jobSkills = jobProps.hardSkills || [];
    const cvSkills = cvProps.skills || [];

    if (jobSkills.length === 0) return { score: 100 };
    if (cvSkills.length === 0) return { score: 0 };

    const cvSkillsLower = cvSkills.map((s: string) => s.toLowerCase());
    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    const COMMON_SKILLS = ['word', 'excel', 'powerpoint', 'teamwork', 'communication', 'english', 'giao tiếp', 'làm việc nhóm', 'tiếng anh'];
    
    let totalWeight = 0;
    let earnedWeight = 0;

    jobSkills.forEach((skill: string) => {
      const lowerSkill = skill.toLowerCase();
      const weight = COMMON_SKILLS.some(c => lowerSkill.includes(c)) ? 0.5 : 2.0;
      totalWeight += weight;

      let found = false;

      // 1. Tìm trong mảng skills đã bóc tách
      if (cvSkillsLower.some((cvS: string) => typeof cvS === 'string' && (cvS.includes(lowerSkill) || lowerSkill.includes(cvS)))) {
        found = true;
      } 
      // 2. Tìm quét qua toàn bộ text của CV (dự phòng trường hợp bộ thu thập bỏ sót)
      else if (cvProps.fullText) {
        if (lowerSkill.length <= 2) {
           const regex = new RegExp(`\\b${lowerSkill.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\b`, 'i');
           if (regex.test(cvProps.fullText)) found = true;
        } else {
           if (cvProps.fullText.includes(lowerSkill)) found = true;
        }
      }

      if (found) {
        matchedSkills.push(skill);
        earnedWeight += weight;
      } else {
        missingSkills.push(skill);
      }
    });

    const score = totalWeight === 0 ? 100 : Math.round((earnedWeight / totalWeight) * 100);

    return {
      score,
      details: {
        matchedSkills,
        missingSkills,
      },
    };
  }
}
