import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';
import { AiService } from '../../../ai/ai.service';

@Injectable()
export class RelevantExpStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(RelevantExpStrategy.name);

  constructor(private readonly aiService: AiService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const jobDesc = `${job.description} ${job.requirements}`;
      const workHistory = (cv.parsedData?.workHistory || [])
        .map((exp: any) => `${exp.role} ${exp.description} ${exp.achievements || ''}`)
        .join('\n');
      
      const projects = (cv.parsedData?.projects || [])
        .map((proj: any) => `${proj.projectName} ${proj.description}`)
        .join('\n');

      const fullCvExp = `${workHistory}\n${projects}`;

      if (!fullCvExp.trim()) {
        return { score: 0, details: { message: 'Ứng viên chưa có kinh nghiệm làm việc hoặc dự án' } };
      }

      // Sử dụng AI để so khớp độ liên quan giữa yêu cầu công việc và kinh nghiệm thực tế
      const similarity = await this.aiService.calculateSemanticSimilarity(jobDesc, fullCvExp);

      return {
        score: similarity * 100,
        details: { similarity, message: 'Phân tích độ tương đồng dự án và trách nhiệm công việc' }
      };
    } catch (error) {
      this.logger.error(`RelevantExp Match Error: ${error.message}`);
      return { score: 50 };
    }
  }
}
