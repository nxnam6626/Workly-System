import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CvParsedData } from './interfaces/cv-parsing.interface';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import axios from 'axios';

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
6. Skill Levels: Chỉ được phép trả về một trong các giá trị sau: 'BEGINNER' (Cơ bản), 'INTERMEDIATE' (Trung cấp), 'ADVANCED' (Cao cấp/Chuyên gia).
7. Trả về đúng JSON Schema yêu cầu. Bắt buộc duy nhất khối JSON.
`.trim();

const CV_SCHEMA_TEXT = `
JSON Schema yêu cầu:
{
  "personal_info": { "full_name": "string", "email": "string", "phone": "string", "location": "string", "gpa": "number" },
  "summary": "string",
  "desired_job": { "jobTitle": "string", "jobType": "string", "expectedSalary": "string", "location": "string" },
  "categories": ["string"],
  "education": { "degree": "string", "major": "string", "institution": "string" },
  "certifications": ["string"],
  "skills": {
    "hard_skills": [{ "skillName": "string", "level": "BEGINNER | INTERMEDIATE | ADVANCED" }],
    "soft_skills": [{ "skillName": "string", "level": "BEGINNER | INTERMEDIATE | ADVANCED" }]
  },
  "experience": {
    "total_months": "number",
    "roles": [{ "job_title": "string", "company_or_project": "string", "duration": "string", "description": "string" }]
  },
  "projects": [{ "projectName": "string", "description": "string", "role": "string", "technology": "string" }]
}
`;


@Injectable()
export class CvParsingService {
  private readonly logger = new Logger(CvParsingService.name);
  private groqApiKey: string | null = null;

  constructor(private readonly configService: ConfigService) {
    require('dotenv').config({ override: true });


    // Config Groq
    this.groqApiKey = this.configService.get<string>('GROQ_API_KEY') || process.env.GROQ_API_KEY || null;
    if (this.groqApiKey) {
      this.logger.log('Đã cấu hình Groq API cho CV Parsing (Tăng tốc độ).');
    }
  }


  async extractTextLocal(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      if (mimeType === 'application/pdf') {
        const parser = new PDFParse(new Uint8Array(buffer));
        const data = await parser.getText();
        return data.text || '';
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

  private async parseWithGroq(text: string): Promise<CvParsedData | null> {
    if (!this.groqApiKey) return null;

    try {
      // Llama models sometimes loop or generate invalid JSON if control characters (like null bytes) are present.
      // We sanitize the text to remove invalid control characters (except newlines/tabs).
      const sanitizedText = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '');

      this.logger.log('[CV Parsing] Đang phân tích bằng Groq (Llama-3.3-70b)...');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `${CV_EXTRACTION_PROMPT}\n\n${CV_SCHEMA_TEXT}`,
            },
            {
              role: 'user',
              content: `NỘI DUNG VĂN BẢN CV:\n${sanitizedText}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 8192, // Explicitly set max_tokens to prevent truncation leading to invalid JSON
          response_format: { type: 'json_object' },
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const parsedData = response.data.choices[0].message.content;
      return this.cleanAndParseJson(parsedData) as CvParsedData;
    } catch (error: any) {
      const groqErrorDetail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      this.logger.warn(`[CV Parsing] Groq parsing thất bại: ${groqErrorDetail}`);
      return null;
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
    if (!buffer) return null;

    if (!this.groqApiKey) {
      this.logger.error('Groq API Key is not configured. Cannot parse CV.');
      return null;
    }

    this.logger.log(`[CV Parsing] Bắt đầu luồng siêu tốc với Groq API...`);

    try {
      // 1. Bóc tách văn bản thô local (Cực nhanh cho PDF digital và Word)
      const rawText = await this.extractTextLocal(buffer, mimeType);

      if (!rawText || rawText.length < 50) {
        this.logger.warn(`[CV Parsing] Không thể bóc tách đủ văn bản từ file (Có thể là file scan hoặc ảnh).`);
        return null;
      }

      this.logger.log(`[CV Parsing] Bóc tách thành công (${rawText.length} kí tự). Gửi tới Groq...`);

      // 2. Gửi tới Groq để phân tích cấu trúc JSON
      const groqResult = await this.parseWithGroq(rawText);

      if (groqResult) {
        this.logger.log('✅ Thành công tại Groq API (Luồng siêu tốc)');
        return groqResult;
      }

      this.logger.error('[CV Parsing] Groq parsing không trả về kết quả.');
      return null;

    } catch (error: any) {
      this.logger.error(`[CV Parsing] Lỗi trong quá trình phân tích: ${error.message}`);
      return null;
    }
  }
}
