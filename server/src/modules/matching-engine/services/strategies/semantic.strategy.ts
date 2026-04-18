import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { IMatchingStrategy, MatchingResult } from '../../interfaces/matching.interface';

@Injectable()
export class SemanticStrategy implements IMatchingStrategy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính điểm dựa trên độ tương đồng ngữ nghĩa (Semantic Similarity)
   * Sử dụng pgvector với toán tử <=> (Cosine Distance)
   */
  async calculate(jobId: any, cvId: any): Promise<MatchingResult> {
    try {
      // Thực hiện tính toán tương đồng Cosine trực tiếp bằng SQL Raw
      // Tránh việc SELECT trực tiếp cột embedding (Prisma không hỗ trợ select Unsupported)
      const results: any[] = await this.prisma.$queryRaw`
        SELECT (1 - (j.embedding <=> c.embedding)) as similarity
        FROM "JobPosting" j, "CV" c
        WHERE j."jobPostingId" = ${jobId} 
        AND c."cvId" = ${cvId}
        AND j.embedding IS NOT NULL 
        AND c.embedding IS NOT NULL
      `;

      const similarity = results[0]?.similarity || 0;
      const score = Math.max(0, Math.min(100, Math.round(similarity * 100)));

      return { score };
    } catch (error) {
      console.error('[SemanticStrategy] Match Error:', error);
      return { score: 0 };
    }
  }
}
