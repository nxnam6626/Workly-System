import { Injectable, Logger } from '@nestjs/common';
import { MatchingStrategyFactory } from './matching-strategy.factory';
import { DataParserService } from './data-parser.service';

@Injectable()
export class ScoringEngineService {
  private readonly logger = new Logger(ScoringEngineService.name);

  constructor(
    private readonly strategyFactory: MatchingStrategyFactory,
    private readonly dataParser: DataParserService,
  ) {}

  /**
   * Tính toán điểm tổng hợp (Weighted Score)
   */
  async calculateFinalScore(
    job: any,
    cv: any,
    options: { isCompanyVerified?: boolean } = {},
  ): Promise<{
    finalScore: number;
    breakdown: {
      keywordScore: number;
      semanticScore: number;
      experienceScore: number;
      educationScore: number;
      hardFilterScore: number;
    };
    details: any;
  }> {
    // 1. Hard Skills (40% tổng) = (Keyword * 0.4) + (Semantic * 0.6)
    const keywordStrategy = this.strategyFactory.getStrategy('keyword');
    
    // Normalize skills for strategy
    const skillsObj = cv.parsedData?.skills;
    const flattenedSkills = Array.isArray(skillsObj)
      ? skillsObj
      : [
          ...(skillsObj?.hard_skills || []),
          ...(skillsObj?.soft_skills || [])
        ].map(s => typeof s === 'string' ? s : s.skillName);

    const keywordRes = await keywordStrategy.calculate(
      (job.structuredRequirements as any) || {},
      { skills: flattenedSkills },
    );

    const semanticStrategy = this.strategyFactory.getStrategy('semantic');
    const semanticRes = await semanticStrategy.calculate(job.jobPostingId, cv.cvId);

    const hardSkillsScore = (keywordRes.score * 0.4) + (semanticRes.score * 0.6);

    // 2. Experience (30% tổng)
    const expStrategy = this.strategyFactory.getStrategy('experience');
    const expRes = await expStrategy.calculate(job, cv);

    // 3. Education (20% tổng) 
    const eduStrategy = this.strategyFactory.getStrategy('education');
    const eduRes = await eduStrategy.calculate(job, cv);

    // 4. Soft Skills (10% tổng) - Tạm thời mô phỏng qua Semantic hoặc một phần của Keyword
    // Trong thực tế sẽ có SoftSkillsStrategy riêng
    const softSkillsScore = 75; // Mock score hoặc lấy từ AI analysis

    // 5. Hard Filters (Penalty)
    const filterStrategy = this.strategyFactory.getStrategy('hardFilter');
    const filterRes = await filterStrategy.calculate(job, cv);
    
    // TÍNH TOÁN TỔNG HỢP
    let finalScore = 
      (hardSkillsScore * 0.4) + 
      (expRes.score * 0.3) + 
      (eduRes.score * 0.2) + 
      (softSkillsScore * 0.1);

    // Áp dụng phạt từ Hard Filter (nếu có)
    if (filterRes.score < 100) {
      const penalty = (100 - filterRes.score) * 0.5; // Giảm tối đa 50% điểm phạt
      finalScore = Math.max(0, finalScore - penalty);
    }

    // Thưởng điểm công ty xác thực
    if (options.isCompanyVerified) {
      finalScore = Math.min(100, finalScore + 5);
    }

    return {
      finalScore: Math.round(finalScore),
      breakdown: {
        keywordScore: Math.round(keywordRes.score),
        semanticScore: Math.round(semanticRes.score),
        experienceScore: Math.round(expRes.score),
        educationScore: Math.round(eduRes.score),
        hardFilterScore: Math.round(filterRes.score),
      },
      details: {
        ...keywordRes.details,
        experience: expRes.details,
        education: eduRes.details,
        filters: filterRes.details,
      },
    };
  }
}
