import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class IndustryStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(IndustryStrategy.name);

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      // Giả sử job.structuredRequirements có trường categories
      const jobCategories = job.structuredRequirements?.categories || [];
      const cvIndustry = (cv.parsedData?.industry || '').toLowerCase();
      const candidateIndustries = (cv.candidate?.industries || []).map((i: string) => i.toLowerCase());
      
      if (jobCategories.length === 0) return { score: 100 };

      // Kiểm tra xem ngành nghề của CV có nằm trong categories của Job không
      const isMatch = jobCategories.some(cat => {
        const catLower = cat.toLowerCase();
        return catLower.includes(cvIndustry) || 
               cvIndustry.includes(catLower) ||
               candidateIndustries.some((ci: string) => ci.includes(catLower) || catLower.includes(ci));
      });

      return {
        score: isMatch ? 100 : 0,
        details: { jobCategories, cvIndustry, isMatch }
      };
    } catch (error) {
      this.logger.error(`Industry Match Error: ${error.message}`);
      return { score: 100 };
    }
  }
}
