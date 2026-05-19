import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';

@Injectable()
export class IndustryStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(IndustryStrategy.name);

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      // Giả sử job.structuredRequirements có trường categories
      const jobCategories = job.structuredRequirements?.categories || [];
      const cvIndustry = (cv.parsedData?.industry || '').toLowerCase();
      const candidateIndustries = (cv.candidate?.industries || []).map(
        (i: string) => i.toLowerCase(),
      );

      if (jobCategories.length === 0) return { 
        score: 100, 
        details: { jobCategories: [], cvIndustry: cvIndustry || 'Không rõ', isMatch: true, message: 'Không yêu cầu ngành nghề' } 
      };

      // Kiểm tra xem ngành nghề của CV có nằm trong categories của Job không
      const isMatch = jobCategories.some((cat) => {
        const catLower = cat.toLowerCase();
        
        const matchesCvIndustry = cvIndustry ? (catLower.includes(cvIndustry) || cvIndustry.includes(catLower)) : false;
        const matchesCandidateIndustries = candidateIndustries.some(
          (ci: string) => ci && (ci.includes(catLower) || catLower.includes(ci)),
        );

        return matchesCvIndustry || matchesCandidateIndustries;
      });

      const combinedCvIndustry = [cv.parsedData?.industry, ...(cv.candidate?.industries || [])]
        .filter(Boolean)
        .join(', ');

      return {
        score: isMatch ? 100 : 0,
        details: { jobCategories, cvIndustry: combinedCvIndustry || 'Chưa cập nhật', isMatch },
      };
    } catch (error) {
      this.logger.error(`Industry Match Error: ${error.message}`);
      return { score: 100 };
    }
  }
}
