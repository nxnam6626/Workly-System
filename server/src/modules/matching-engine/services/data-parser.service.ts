import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class DataParserService {
  private readonly logger = new Logger(DataParserService.name);
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;

  constructor() {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  /**
   * Làm sạch văn bản thô (loại bỏ khoảng trắng dư thừa, ký tự đặc biệt)
   */
  cleanText(text: string): string {
    if (!text) return '';
    return text
      .replace(/[\n\r\t]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Tạo Vector Embedding (768 chiều) từ văn bản sử dụng Gemini
   */
  async getEmbedding(text: string): Promise<number[]> {
    if (!this.isConfigured || !text) {
      return new Array(768).fill(0);
    }

    try {
      // 1. Thử với model chính (Gemini Embedding 2)
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-embedding-2-preview',
      });
      
      const cleanedText = this.cleanText(text).substring(0, 10000);
      // Ép kiểu đầu ra về 768 chiều (Sử dụng any để vượt qua lỗi types cũ của SDK)
      const result = await model.embedContent({
        content: { parts: [{ text: cleanedText }], role: 'user' },
        taskType: 'RETRIEVAL_DOCUMENT' as any,
        outputDimensionality: 768,
      } as any);
      
      // Slicing để đảm bảo an toàn tuyệt đối nếu SDK ko nhận tham số
      return result.embedding.values.slice(0, 768);
    } catch (error) {
      this.logger.warn(`Primary model failed, falling back to gemini-embedding-001: ${error.message}`);
      
      try {
        // 2. Dự phòng với model v1 (Gemini Embedding 1)
        const fallbackModel = this.genAI.getGenerativeModel({
          model: 'gemini-embedding-001',
        });
        
        const cleanedText = this.cleanText(text).substring(0, 10000);
        const result = await fallbackModel.embedContent({
          content: { parts: [{ text: cleanedText }], role: 'user' },
          taskType: 'RETRIEVAL_DOCUMENT' as any,
          outputDimensionality: 768,
        } as any);
        return result.embedding.values.slice(0, 768);
      } catch (fallbackError) {
        this.logger.error(`Both embedding models failed: ${fallbackError.message}`);
        return new Array(768).fill(0);
      }
    }
  }

  /**
   * Tính toán trọng số dựa trên kinh nghiệm (Logic Giai đoạn 1)
   */
  calculateExperienceWeight(candidateYears: number, requiredYears: number): number {
    if (requiredYears <= 1) return 1.0; // Entry level boost
    if (candidateYears >= requiredYears) return 1.0;
    return Math.max(0.5, candidateYears / requiredYears);
  }
}
