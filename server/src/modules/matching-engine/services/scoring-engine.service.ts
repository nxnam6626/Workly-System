import { Injectable, Logger } from '@nestjs/common';
import { MatchingStrategyFactory } from './matching-strategy.factory';
import { DataParserService } from './data-parser.service';
import { WEIGHT_MATRIX, PENALTY, DEFAULT_WEIGHTS } from '../matching.config';

@Injectable()
export class ScoringEngineService {
  private readonly logger = new Logger(ScoringEngineService.name);

  constructor(
    private readonly strategyFactory: MatchingStrategyFactory,
    private readonly dataParser: DataParserService,
  ) {}

  /**
   * Tính toán điểm tổng hợp (Multi-tier Weighted Score)
   */
  async calculateFinalScore(
    job: any,
    cv: any,
  ): Promise<{
    finalScore: number;
    breakdown: {
      locationScore: number;
      salaryScore: number;
      industryScore: number;
      jobTitleScore: number;
      experienceScore: number;
      relevantExpScore: number;
      educationScore: number;
      skillsScore: number;
      languageScore: number;
    };
    details: any;
  }> {
    const jobLevel = job.jobLevel || 'JUNIOR';
    const weights = WEIGHT_MATRIX[jobLevel] || DEFAULT_WEIGHTS;

    // --- TẦNG 1: NHÓM SÀNG LỌC TIÊN QUYẾT (HARD FILTERS) ---
    const locationStrategy = this.strategyFactory.getStrategy('location');
    const industryStrategy = this.strategyFactory.getStrategy('industry');

    const locationRes = await locationStrategy.calculate(job, cv);
    const industryRes = await industryStrategy.calculate(job, cv);

    // --- TẦNG 2: NHÓM CHẤM ĐIỂM THÀNH PHẦN (COMPONENT SCORING) ---
    const skillsRes = await this.calculateSkillsScore(job, cv);
    const expRes = await this.strategyFactory.getStrategy('experience').calculate(job, cv);
    const relExpRes = await this.strategyFactory.getStrategy('relevantExp').calculate(job, cv);
    const eduRes = await this.strategyFactory.getStrategy('education').calculate(job, cv);
    const langRes = await this.strategyFactory.getStrategy('language').calculate(job, cv);
    const titleRes = await this.strategyFactory.getStrategy('jobTitle').calculate(job, cv);

    // --- TẦNG 2: NHÓM TÍNH ĐIỂM (WEIGHTED SCORING) ---
    const weightedBaseScore =
      (skillsRes.score * weights.skills) +
      (eduRes.score * weights.education) +
      (relExpRes.score * weights.relevantExp) +
      (langRes.score * weights.languages) +
      (titleRes.score * weights.jobTitle) +
      (expRes.score * (weights.experience || 0));

    // --- TẦNG 3: NHÓM ĐIỀU CHỈNH (MODIFIERS) ---
    const salaryStrategy = this.strategyFactory.getStrategy('salary');
    const salaryRes = await salaryStrategy.calculate(job, cv);

    // --- TÍNH TOÁN HÌNH PHẠT (PENALTIES) ---
    let totalPenalty = 0;

    // Penalty Tầng 1: Địa điểm (Trừ 40% nếu không khớp)
    if (locationRes.score === 0) {
      totalPenalty += PENALTY.LOCATION_MISMATCH;
    }

    // Penalty Tầng 1: Ngành nghề (Trừ 50% nếu không khớp)
    if (industryRes.score === 0) {
      totalPenalty += PENALTY.INDUSTRY_MISMATCH;
    }

    // Penalty Tầng 3: Lương (Trừ theo tỷ lệ vượt ngân sách, tối đa 10%)
    if (salaryRes.score < 100) {
      const salaryPenalty = (100 - salaryRes.score) * (PENALTY.SALARY_OVER_BUDGET / 100);
      totalPenalty += salaryPenalty;
    }

    // --- KẾT QUẢ CUỐI CÙNG ---
    const finalScore = Math.max(0, weightedBaseScore - totalPenalty);

    return {
      finalScore: Math.round(finalScore),
      breakdown: {
        locationScore: Math.round(locationRes.score),
        salaryScore: Math.round(salaryRes.score),
        industryScore: Math.round(industryRes.score),
        jobTitleScore: Math.round(titleRes.score),
        experienceScore: Math.round(expRes.score),
        relevantExpScore: Math.round(relExpRes.score),
        educationScore: Math.round(eduRes.score),
        skillsScore: Math.round(skillsRes.score),
        languageScore: Math.round(langRes.score),
      },
      details: {
        weights,
        locationDetails: locationRes.details,
        industryDetails: industryRes.details,
        salaryDetails: salaryRes.details,
        skillDetails: skillsRes.details,
        titleDetails: titleRes.details,
        penaltyApplied: totalPenalty
      },
    };
  }

  /**
   * Tính toán điểm kỹ năng (Kết hợp Keyword & Semantic)
   */
  private async calculateSkillsScore(job: any, cv: any) {
    const keywordStrategy = this.strategyFactory.getStrategy('keyword');
    const semanticStrategy = this.strategyFactory.getStrategy('semantic');

    // Normalize skills
    const skillsObj = cv.parsedData?.skills;
    const flattenedSkills = Array.isArray(skillsObj)
      ? skillsObj.map(s => typeof s === 'string' ? s : (s?.skillName || ''))
      : [
          ...(skillsObj?.hard_skills || []),
          ...(skillsObj?.soft_skills || [])
        ].map(s => typeof s === 'string' ? s : (s?.skillName || ''));

    const cvFullText = JSON.stringify(cv.parsedData || {}).toLowerCase();

    const keywordRes = await keywordStrategy.calculate(
      (job.structuredRequirements as any) || {},
      { skills: flattenedSkills, fullText: cvFullText },
    );

    const semanticRes = await semanticStrategy.calculate(job, cv);

    return {
      score: (keywordRes.score * 0.4) + (semanticRes.score * 0.6),
      details: {
        keywordScore: keywordRes.score,
        semanticScore: semanticRes.score,
        matchedSkills: keywordRes.details?.matchedSkills || []
      }
    };
  }
}
