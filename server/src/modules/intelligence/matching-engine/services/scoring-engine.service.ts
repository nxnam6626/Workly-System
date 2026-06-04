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
  ) { }

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

    // --- TẦNG 2 & TẦNG 3: CHẠY SONG SONG ĐỂ TĂNG TỐC (PARALLEL EXECUTION) ---
    const [skillsRes, expRes, relExpRes, eduRes, langRes, titleRes, salaryRes] =
      await Promise.all([
        this.calculateSkillsScore(job, cv),
        this.strategyFactory.getStrategy('experience').calculate(job, cv),
        this.strategyFactory.getStrategy('relevantExp').calculate(job, cv),
        this.strategyFactory.getStrategy('education').calculate(job, cv),
        this.strategyFactory.getStrategy('language').calculate(job, cv),
        this.strategyFactory.getStrategy('jobTitle').calculate(job, cv),
        this.strategyFactory.getStrategy('salary').calculate(job, cv),
      ]);

    // --- TẦNG 2: NHÓM TÍNH ĐIỂM (WEIGHTED SCORING) ---
    const weightedBaseScore =
      skillsRes.score * weights.skills +
      eduRes.score * weights.education +
      relExpRes.score * weights.relevantExp +
      langRes.score * weights.languages +
      titleRes.score * weights.jobTitle +
      expRes.score * (weights.experience || 0);

    // --- TÍNH TOÁN HÌNH PHẠT (PENALTIES) & HARD FILTERS ---
    let totalPenalty = 0;

    // Knockout Tầng 1: Địa điểm (Loại trực tiếp nếu không khớp)
    if (locationRes.score === 0) {
      return {
        finalScore: 0,
        breakdown: {
          locationScore: 0,
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
          message: 'Loại trực tiếp: Không khớp địa điểm làm việc',
          locationDetails: locationRes.details,
        },
      };
    }

    // Penalty Tầng 1: Ngành nghề (Trừ 50% nếu không khớp)
    if (industryRes.score === 0) {
      totalPenalty += PENALTY.INDUSTRY_MISMATCH;
    }

    // Penalty Tầng 3: Lương (Trừ theo tỷ lệ vượt ngân sách, tối đa 10%)
    if (salaryRes.score < 100) {
      const salaryPenalty =
        (100 - salaryRes.score) * (PENALTY.SALARY_OVER_BUDGET / 100);
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
        educationDetails: eduRes.details,
        experienceDetails: expRes.details,
        relevantExpDetails: relExpRes.details,
        languageDetails: langRes.details,
        penaltyApplied: totalPenalty,
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
      ? skillsObj.map((s) => (typeof s === 'string' ? s : s?.skillName || ''))
      : [
        ...(skillsObj?.hard_skills || []),
        ...(skillsObj?.soft_skills || []),
      ].map((s) => (typeof s === 'string' ? s : s?.skillName || ''));

    const cvFullText = JSON.stringify(cv.parsedData || {}).toLowerCase();

    const keywordRes = await keywordStrategy.calculate(
      job.structuredRequirements || {},
      { skills: flattenedSkills, fullText: cvFullText },
    );

    const semanticRes = await semanticStrategy.calculate(job, cv);

    let finalSkillScore = keywordRes.score;
    // Điểm Semantic chỉ dùng để cộng điểm thưởng (vớt) cho phần trăm còn thiếu
    if (keywordRes.score < 100) {
      const bonus = (100 - keywordRes.score) * (semanticRes.score / 100);
      finalSkillScore += bonus;
    }

    // Option C: Chứng chỉ chuyên môn xác minh hệ số
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
    const professionalCerts = candidateCerts.filter((c: any) => {
      const nameLower = c.name.toLowerCase();
      return !langKeywords.some((kw) => nameLower.includes(kw));
    });

    const jobText =
      `${job.title} ${job.requirements || ''} ${job.description || ''}`.toLowerCase();
    const jobRequiresCert = ['chứng chỉ', 'cert', 'license', 'credential'].some(
      (kw) => jobText.includes(kw),
    );

    let skillsMultiplier = 1.0;
    let skillVerificationStatus = 'NOT_APPLICABLE';

    if (jobRequiresCert || professionalCerts.length > 0) {
      skillsMultiplier = 0.3; // Mặc định phạt nếu có khai báo hoặc job yêu cầu nhưng chưa nộp minh chứng
      skillVerificationStatus = 'UNVERIFIED';

      if (professionalCerts.length > 0) {
        const statuses = professionalCerts.map((c: any) => c.status);
        if (statuses.includes('VERIFIED')) {
          skillsMultiplier = 1.0;
          skillVerificationStatus = 'VERIFIED';
        } else if (statuses.includes('PENDING')) {
          skillsMultiplier = 0.8;
          skillVerificationStatus = 'PENDING';
        }
      }
    }

    finalSkillScore = finalSkillScore * skillsMultiplier;

    return {
      score: Math.round(finalSkillScore),
      details: {
        keywordScore: Math.round(keywordRes.score),
        semanticScore: Math.round(semanticRes.score),
        matchedSkills: keywordRes.details?.matchedSkills || [],
        missingSkills: keywordRes.details?.missingSkills || [],
        skillsMultiplier,
        skillVerificationStatus,
      },
    };
  }
}
