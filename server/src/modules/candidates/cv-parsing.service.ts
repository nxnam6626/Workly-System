import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  SchemaType,
  GenerativeModel,
} from '@google/generative-ai';
import { CvParsedData } from './interfaces/cv-parsing.interface';
import * as mammoth from 'mammoth';

const CV_EXTRACTION_PROMPT = `
Nhiệm vụ: Trích xuất thông tin từ CV thành JSON.
Quy tắc:
1. Không trích xuất thông tin nhạy cảm.
2. Ngôn ngữ: Toàn bộ nội dung mô tả (summary, job description, project description) PHẢI được trả về bằng tiếng Việt.
3. Summary: Trích xuất phần "Giới thiệu/About Me".
4. Desired Job: Trích xuất phần "Mục tiêu nghề nghiệp/Objective".
5. Phân loại: 
   - experience: Lịch sử làm việc tại công ty/tổ chức.
   - projects: Các sản phẩm cá nhân, đồ án.
   - categories: Phân loại mảng chuyên môn/ngành nghề của UV (VD: Backend, Frontend, Marketing, Kế toán, Nhân sự, Sales, Xây dựng, Bán lẻ...). Gán 1-3 thẻ.
6. Trả về đúng JSON Schema yêu cầu. Bắt buộc duy nhất khối JSON.
`.trim();

const CV_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    personal_info: {
      type: SchemaType.OBJECT,
      properties: {
        full_name: { type: SchemaType.STRING },
        email: { type: SchemaType.STRING },
        phone: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
        gpa: { type: SchemaType.NUMBER },
      },
      required: ['full_name', 'email', 'phone'],
    },
    summary: { type: SchemaType.STRING },
    desired_job: {
      type: SchemaType.OBJECT,
      properties: {
        jobTitle: { type: SchemaType.STRING },
        jobType: { type: SchemaType.STRING },
        expectedSalary: { type: SchemaType.STRING },
        location: { type: SchemaType.STRING },
      },
    },
    categories: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Danh mục/mảng chuyên môn/ngành nghề chính của ứng viên (ví dụ: Backend, Marketing, Kế toán, Sales)",
    },
    education: {
      type: SchemaType.OBJECT,
      properties: {
        degree: { type: SchemaType.STRING },
        major: { type: SchemaType.STRING },
        institution: { type: SchemaType.STRING },
      },
    },
    certifications: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    skills: {
      type: SchemaType.OBJECT,
      properties: {
        hard_skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              skillName: { type: SchemaType.STRING },
              level: { type: SchemaType.STRING },
            },
            required: ['skillName', 'level'],
          },
        },
        soft_skills: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              skillName: { type: SchemaType.STRING },
              level: { type: SchemaType.STRING },
            },
            required: ['skillName', 'level'],
          },
        },
      },
    },
    experience: {
      type: SchemaType.OBJECT,
      properties: {
        total_months: { type: SchemaType.NUMBER },
        roles: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              job_title: { type: SchemaType.STRING },
              company_or_project: { type: SchemaType.STRING },
              duration: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
            },
            required: ['job_title', 'company_or_project'],
          },
        },
      },
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          projectName: { type: SchemaType.STRING },
          description: { type: SchemaType.STRING },
          role: { type: SchemaType.STRING },
          technology: { type: SchemaType.STRING },
        },
        required: ['projectName', 'description'],
      },
    },
  },
  required: ['personal_info', 'skills', 'experience'],
};

@Injectable()
export class CvParsingService {
  private readonly logger = new Logger(CvParsingService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private readonly configService: ConfigService) {
    require('dotenv').config({ override: true });
    let apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel(
        {
          model: 'gemini-3.1-flash-lite-preview',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CV_SCHEMA as any,
            maxOutputTokens: 8192,
            temperature: 0.1,
          },
        },
        { apiVersion: 'v1beta' },
      );
      this.logger.log(
        'Đã khởi tạo thành công Gemini 3.1 Flash-Lite cho CV Parsing.',
      );
    }
  }

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    if (!this.genAI) throw new Error('Gemini API is not configured.');
    const modelsToTry = ['gemini-3.1-flash-lite-preview', 'gemini-2.5-flash-lite'];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      try {
        const targetModel = this.genAI.getGenerativeModel(
          { model: modelName },
          { apiVersion: 'v1beta' },
        );
        const filePart = {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: 'application/pdf',
          },
        };

        const result = await targetModel.generateContent([
          'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy, không thêm lời chào, bình luận hay định dạng markdown không cần thiết.',
          filePart,
        ]);
        const response = await result.response;
        const cleanText = response.text().trim();

        this.logger.log(
          `Extracted raw text using ${modelName}, length: ${cleanText.length} characters`,
        );

        if (cleanText.length < 20) {
          throw new Error('PDF_NO_TEXT');
        }

        return cleanText;
      } catch (error: any) {
        lastError = error;
        const msg = error.message || '';
        this.logger.warn(`Model ${modelName} failed (${msg}). Trying next...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    this.logger.error(
      `Tất cả model Gemini đều lỗi khi extract text từ PDF: ${lastError?.message}`,
    );
    throw new Error(
      `Failed to parse PDF using all Gemini models. Lỗi: ${lastError?.message}`,
    );
  }

  async extractTextLocal(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        // pdf-parse removed as requested. Local PDF text extraction is disabled.
        return '';
      }
      if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      }
      if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        return buffer.toString('utf8');
      }
      return '';
    } catch (error: any) {
      this.logger.error(
        `Lỗi bóc tách văn bản local (${mimeType}): ${error.message}`,
      );
      return '';
    }
  }

  private cleanAndParseJson(text: string): any {
    // Tiền xử lý để loại bỏ các ký tự điều khiển lỗi hoặc khoảng trắng thừa
    let cleanText = text.trim();
    
    try {
      // 1. Thử parse trực tiếp
      return JSON.parse(cleanText);
    } catch (e) {
      try {
        // 2. Loại bỏ code blocks nếu có (```json ... ``` hoặc ``` ... ```)
        cleanText = cleanText.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
        
        // 3. Tìm khối JSON bằng regex (từ { đầu tiên đến } cuối cùng)
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonPotential = cleanText.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonPotential);
        }
        
        throw new Error('No JSON structure found');
      } catch (innerError) {
        this.logger.error(`Parse JSON failed. Raw response length: ${text.length}`);
        // Log một phần kết quả để debug nhưng không quá dài
        this.logger.debug(`Preview: ${text.substring(0, 200)}[...]${text.substring(text.length - 100)}`);
        throw new Error(`AI returned invalid JSON: ${innerError.message}`);
      }
    }
  }

  async parseCv(
    buffer: Buffer,
    mimeType: string = 'application/pdf',
  ): Promise<CvParsedData | null> {
    if (!this.genAI || !buffer) return null;

    const tiers = [
      {
        name: 'Layer 1: Gemini 3.0 Flash (Preview)',
        model: 'gemini-3-flash-preview',
      },
      { name: 'Layer 2: Gemini Flash Latest (Stable)', model: 'gemini-flash-latest' },
      {
        name: 'Layer 3: Gemini 3.1 Flash-Lite (Preview)',
        model: 'gemini-3.1-flash-lite-preview',
      },
    ];

    const isWord =
      mimeType.includes('officedocument.wordprocessingml.document') ||
      mimeType.includes('msword');
    let rawText: string | null = null;

    // --- PHASE 1: DIRECT BINARY ATTEMPTS (Only for PDF) ---
    if (!isWord) {
      for (const tier of tiers) {
        this.logger.log(`[CV Parsing] Thử ${tier.name} (Direct Binary)...`);

        try {
          const genModel = this.genAI.getGenerativeModel(
            {
              model: tier.model,
              generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: CV_SCHEMA as any,
                maxOutputTokens: 8192,
                temperature: 0.1,
              },
            },
            { apiVersion: 'v1beta' },
          );

          const filePart = {
            inlineData: {
              data: buffer.toString('base64'),
              mimeType: 'application/pdf',
            },
          };

          const result = await genModel.generateContent([
            CV_EXTRACTION_PROMPT,
            filePart,
          ]);
          const response = await result.response;
          const parsedData = this.cleanAndParseJson(response.text());

          this.logger.log(`✅ Thành công tại ${tier.name} (Direct)`);
          return parsedData as CvParsedData;
        } catch (error: any) {
          this.logger.warn(`❌ ${tier.name} (Direct) thất bại: ${error.message}`);
          if (error.status === 429)
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    // --- PHASE 2: TEXT-ONLY FALLBACK (For Word or after PDF Direct fails) ---
    this.logger.log(
      `[CV Parsing] Chuyển đổi sang luồng bóc tách văn bản thô (Text-only)...`,
    );

    rawText = await this.extractTextLocal(buffer, mimeType);
    if (!rawText || rawText.length < 20) {
      this.logger.error('Không thể bóc tách nội dung văn bản từ file.');
      return null;
    }

    // Thử lại với các model Gemini bằng văn bản thô
    for (const tier of tiers) {
      this.logger.log(`[CV Parsing] Thử ${tier.name} (Text Mode)...`);
      try {
        const genModel = this.genAI.getGenerativeModel(
          {
            model: tier.model,
            generationConfig: {
              responseMimeType: 'application/json',
              responseSchema: CV_SCHEMA as any,
              maxOutputTokens: 8192,
              temperature: 0.1,
            },
          },
          { apiVersion: 'v1beta' },
        );

        const promptWithText = `${CV_EXTRACTION_PROMPT}\n\nNỘI DUNG VĂN BẢN CV:\n${rawText}`;
        const result = await genModel.generateContent(promptWithText);
        const response = await result.response;
        const parsedData = this.cleanAndParseJson(response.text());

        this.logger.log(`✅ Thành công tại ${tier.name} (Text Mode)`);
        return parsedData as CvParsedData;
      } catch (error: any) {
        this.logger.warn(`❌ ${tier.name} (Text Mode) thất bại: ${error.message}`);
        if (error.status === 429)
          await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    this.logger.error('Tất cả các phương pháp bóc tách CV đều thất bại.');
    return null;
  }
}
