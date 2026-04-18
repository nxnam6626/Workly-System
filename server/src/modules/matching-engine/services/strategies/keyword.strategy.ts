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

    jobSkills.forEach((skill: string) => {
      if (cvSkillsLower.includes(skill.toLowerCase())) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const score = Math.round((matchedSkills.length / jobSkills.length) * 100);

    return {
      score,
      details: {
        matchedSkills,
        missingSkills,
      },
    };
  }
}
