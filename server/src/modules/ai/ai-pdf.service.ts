import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiPdfService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiPdfService.name);

  constructor() {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  async extractTextFromLocalFile(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const absolutePath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(absolutePath)) return '';

      const dataBuffer = fs.readFileSync(absolutePath);

      if (!this.isConfigured) return '';

      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
      ];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy, không thêm lời chào, bình luận hay định dạng markdown không cần thiết.',
            {
              inlineData: {
                data: dataBuffer.toString('base64'),
                mimeType: 'application/pdf',
              },
            },
          ]);
          return result.response.text().trim();
        } catch (innerError: any) {
          this.logger.warn(
            `[AiPdfService] Local PDF extraction failed with ${modelName}. Trying next...`,
          );
          await SLEEP(500);
        }
      }
      throw new Error('All Gemini models failed for local PDF extraction');
    } catch (e: any) {
      this.logger.error('Error parsing local PDF with Gemini: ' + e.message);
      return '';
    }
  }

  async extractTextFromBuffer(buffer: Buffer, mimeType: string = 'application/pdf'): Promise<string> {
    if (!this.isConfigured) return '';
    try {
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
      ];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF/Document này một cách rõ ràng và chính xác. Trả về nội dung thuần túy.',
            {
              inlineData: {
                data: buffer.toString('base64'),
                mimeType,
              },
            },
          ]);
          return result.response.text().trim();
        } catch (innerError: any) {
          this.logger.warn(`[AiPdfService] Buffer extraction failed with ${modelName}. Trying next...`);
          await SLEEP(500);
        }
      }
      return '';
    } catch (e: any) {
      this.logger.error('Error parsing buffer with Gemini: ' + e.message);
      return '';
    }
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      const dataBuffer = Buffer.from(response.data);

      if (!this.isConfigured) return '';

      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
      ];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy, không thêm lời chào, bình luận hay định dạng markdown không cần thiết.',
            {
              inlineData: {
                data: dataBuffer.toString('base64'),
                mimeType: 'application/pdf',
              },
            },
          ]);
          return result.response.text().trim();
        } catch (innerError: any) {
          this.logger.warn(
            `[AiPdfService] URL PDF extraction failed with ${modelName}. Trying next...`,
          );
          await SLEEP(500);
        }
      }
      throw new Error('All Gemini models failed for URL PDF extraction');
    } catch (e: any) {
      this.logger.error('Error fetching/parsing PDF with Gemini: ' + e.message);
      return '';
    }
  }
}
