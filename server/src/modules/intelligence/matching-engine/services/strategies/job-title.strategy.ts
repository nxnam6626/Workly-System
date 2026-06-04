import { Injectable, Logger } from '@nestjs/common';
import {
  IMatchingStrategy,
  MatchingResult,
} from '../../interfaces/matching.interface';
import { AiService } from '@/modules/intelligence/ai/ai.service';

@Injectable()
export class JobTitleStrategy implements IMatchingStrategy {
  private readonly logger = new Logger(JobTitleStrategy.name);

  constructor(private readonly aiService: AiService) {}

  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const rawJobTitle = job.title || job.jobTitle || '';

      // 1. Tìm chức danh ứng viên từ nhiều nguồn
      const candidateObj = cv.candidate;
      const desiredJob = candidateObj?.desiredJob;
      const experiences =
        candidateObj?.experiences || cv.parsedData?.experiences || [];
      const latestExp = experiences.length > 0 ? experiences[0].role : '';

      const rawCvTitle =
        desiredJob?.title ||
        latestExp ||
        candidateObj?.fullName ||
        cv.parsedData?.currentRole ||
        cv.parsedData?.title ||
        '';

      if (!rawJobTitle || !rawCvTitle) {
        return {
          score: 0,
          details: {
            jobTitle: rawJobTitle || 'N/A',
            cvTitle: rawCvTitle || 'N/A',
            similarity: 0,
          },
        };
      }

      // 2. Làm sạch tiêu đề (Sanitization)
      const sanitize = (text: string) => {
        return text
          .toLowerCase()
          .replace(
            /tuyển dụng|cần tuyển|tìm việc|việc làm|hot|gấp|lương cao|thu nhập khủng|hà nội|hcm|tp hcm|tphcm|toàn quốc/gi,
            '',
          )
          .replace(/[&/\\#,+()$~%.'":*?<>{}]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const jobTitle = sanitize(rawJobTitle);
      const cvTitle = sanitize(rawCvTitle);

      // 3. Chuẩn hóa từ vựng và sắp xếp để so sánh không phân biệt thứ tự từ
      const normalizeWords = (str: string) => {
        return str
          .replace(/\bdev\b/g, 'developer')
          .replace(/\bsr\b/g, 'senior')
          .replace(/\bjr\b/g, 'junior')
          .replace(/\bqc\b/g, 'quality control')
          .replace(/\bqa\b/g, 'quality assurance')
          .replace(/\bba\b/g, 'business analyst')
          .replace(/\bse\b/g, 'software engineer')
          .replace(/\bjs\b/g, 'javascript')
          .split(' ')
          .filter(Boolean)
          .sort()
          .join(' ');
      };

      const normJob = normalizeWords(jobTitle);
      const normCv = normalizeWords(cvTitle);

      // 4. Kiểm tra khớp tập con hoặc trùng lặp từ vựng hoàn toàn
      if (
        jobTitle.includes(cvTitle) || 
        cvTitle.includes(jobTitle) ||
        normJob === normCv ||
        normJob.includes(normCv) ||
        normCv.includes(normJob)
      ) {
        return {
          score: 100,
          details: {
            jobTitle: rawJobTitle,
            cvTitle: rawCvTitle,
            similarity: 1,
            method: 'keyword_exact',
          },
        };
      }

      let similarity = 0;
      try {
        // 4. Sử dụng AI để tính độ tương đồng ngữ nghĩa
        similarity = await this.aiService.calculateSemanticSimilarity(
          jobTitle,
          cvTitle,
        );
        // Nếu AI chấm > 0.7, ta làm tròn lên mức cao (Stretching)
        if (similarity > 0.7) similarity = Math.min(1, similarity + 0.2);
      } catch (e) {
        this.logger.warn(`AI Semantic Similarity failed for titles`);
        const jWords = jobTitle.split(' ');
        const matched = jWords.filter(
          (w) => w.length > 2 && cvTitle.includes(w),
        );
        similarity = Math.min(1, matched.length / jWords.length + 0.3);
      }

      return {
        score: Math.round(similarity * 100),
        details: {
          jobTitle: rawJobTitle,
          cvTitle: rawCvTitle,
          similarity: Math.round(similarity * 100) / 100,
        },
      };
    } catch (error) {
      this.logger.error(`JobTitle Match Error: ${error.message}`);
      return {
        score: 0,
        details: {
          jobTitle: job.title || 'N/A',
          cvTitle: 'Lỗi',
          similarity: 0,
        },
      };
    }
  }
}
