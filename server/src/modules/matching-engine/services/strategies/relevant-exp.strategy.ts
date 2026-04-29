import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';
import { AiService } from '../../../ai/ai.service';

@Injectable()
export class RelevantExpStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(RelevantExpStrategy.name);

  constructor(private readonly aiService: AiService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const jobDesc = `${job.title} ${job.description} ${job.requirements}`;
      
      // 1. Thu thập kinh nghiệm từ nhiều nguồn (Ưu tiên Profile thủ công)
      const candidateObj = (cv as any).candidate;
      
      const profileExps = (candidateObj?.experiences || [])
        .map((exp: any) => `${exp.role} tại ${exp.company}: ${exp.description || ''}`)
        .join('\n');
      
      const profileProjects = (candidateObj?.projects || [])
        .map((proj: any) => `${proj.projectName} (${proj.role || ''}): ${proj.description || ''}`)
        .join('\n');

      const parsedExps = (cv.parsedData?.workHistory || cv.parsedData?.experiences || [])
        .map((exp: any) => `${exp.role || ''} ${exp.description || ''}`)
        .join('\n');

      const fullCvExp = `${profileExps}\n${profileProjects}\n${parsedExps}`.trim();

      if (!fullCvExp) {
        return { 
          score: 0, 
          details: { message: 'Ứng viên chưa cập nhật thông tin kinh nghiệm hoặc dự án' } 
        };
      }

      let similarity = 0;
      try {
        // 2. Sử dụng AI để đánh giá độ liên quan ngữ nghĩa
        similarity = await this.aiService.calculateSemanticSimilarity(jobDesc, fullCvExp);
        
        // Boosting cho các trường hợp rất khớp (như ví dụ CSKH của khách hàng)
        if (similarity > 0.6) {
          similarity = Math.min(1, similarity + 0.25);
        }
      } catch (e) {
        this.logger.warn(`AI Relevant Experience similarity failed, using keyword fallback`);
        // Fallback: Keyword count simple logic
        const keyTerms = job.title.toLowerCase().split(' ').filter(w => w.length > 3);
        const matchCount = keyTerms.filter(t => fullCvExp.toLowerCase().includes(t)).length;
        similarity = Math.min(0.8, (matchCount / keyTerms.length) + 0.2);
      }

      return {
        score: Math.round(similarity * 100),
        details: { 
          similarity: Math.round(similarity * 100) / 100, 
          cvEvidence: fullCvExp,
          message: 'Phân tích chiều sâu giữa trách nhiệm đã làm và yêu cầu công việc' 
        }
      };
    } catch (error) {
      this.logger.error(`RelevantExp Match Error: ${error.message}`);
      return { score: 50 };
    }
  }
}
