import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class SemanticStrategy implements IMatchingStrategy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính điểm dựa trên độ tương đồng ngữ nghĩa (Semantic Similarity)
   * Thay vì query Database bằng pgvector, ta tính Cosine Similarity trên JS.
   * Cách này đảm bảo không phụ thuộc vào `pgvector` ở local environment.
   */
  async calculate(job: any, cv: any): Promise<MatchingResult> {
    try {
      const vecA = job?.embedding;
      const vecB = cv?.embedding;

      if (!Array.isArray(vecA) || !Array.isArray(vecB) || vecA.length !== vecB.length) {
        // Fallback or score 0 if embedding wasn't perfectly parsed
        return { score: 0 };
      }

      // Compute Cosine Similarity
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
      }

      if (normA === 0 || normB === 0) {
        return { score: 0 };
      }

      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
      // Semantic Stretching: Nhúng văn bản (Embedding) thường cho điểm 0.6-0.9 dù không quá liên quan.
      // Do đó ta áp dụng dãn cách: < 0.6 = 0 điểm. Từ 0.6 -> 1.0 sẽ tương ứng 0 -> 100%.
      let stretchedSimilarity = 0;
      if (similarity >= 0.6) {
        stretchedSimilarity = (similarity - 0.6) / 0.4;
      }
      
      // Chuyển score thành thang điểm (0 - 100)
      const normalizedScore = Math.max(0, Math.min(100, Math.round(stretchedSimilarity * 100)));

      return { score: normalizedScore };
    } catch (error) {
      console.warn('[SemanticStrategy] Match Warning: Error computing similarity.', error);
      return { score: 0 };
    }
  }
}
