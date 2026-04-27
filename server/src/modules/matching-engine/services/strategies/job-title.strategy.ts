import { Injectable, Logger } from '@nestjs/common';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';
import { AiService } from '../../../ai/ai.service';

@Injectable()
export class JobTitleStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(JobTitleStrategy.name);

  constructor(private readonly aiService: AiService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const jobTitle = job.title || '';
      const cvTitle = cv.parsedData?.currentRole || cv.parsedData?.title || '';
      
      if (!jobTitle || !cvTitle) {
        return { score: 0, details: { message: 'Thiếu thông tin tiêu đề để so sánh' } };
      }

      // Sử dụng AiService để tính độ tương đồng ngữ nghĩa giữa 2 chức danh
      // Giả sử AiService có hàm compareStrings hoặc tương tự
      // Ở đây ta mô phỏng bằng việc so sánh từ khóa hoặc gọi AI nếu có thể
      const similarity = await this.aiService.calculateSemanticSimilarity(jobTitle, cvTitle);
      
      return {
        score: similarity * 100,
        details: { jobTitle, cvTitle, similarity }
      };
    } catch (error) {
      this.logger.error(`JobTitle Match Error: ${error.message}`);
      return { score: 50 }; // Mặc định trung bình nếu lỗi
    }
  }
}
