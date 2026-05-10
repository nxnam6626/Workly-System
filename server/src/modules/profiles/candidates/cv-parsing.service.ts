import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CvParsedData } from './interfaces/cv-parsing.interface';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import axios from 'axios';
import { HIERARCHICAL_INDUSTRIES } from '../../core-jobs/jobs/job-postings/constants/industries';

const getCvExtractionPrompt = (industriesList: string) => `
Nhiệm vụ: Trích xuất TOÀN BỘ thông tin từ CV thành JSON. Không được bỏ sót bất kỳ mục nào.
Quy tắc quan trọng:
1. Xác thực: AI tự đánh giá xem nội dung có phải là một CV/Resume hợp lệ không. Nếu KHÔNG PHẢI, đặt "is_cv": false.
2. Ngôn ngữ & Dịch thuật (BẮT BUỘC 100%): Toàn bộ các câu văn, nội dung mô tả (Summary, Job Description, Project Description...) PHẢI được dịch sang tiếng Việt một cách tự nhiên. Tuyệt đối không để nguyên tiếng Anh cho các đoạn văn mô tả. Chỉ giữ lại thuật ngữ kỹ thuật (VD: Java, React).
3. Trích xuất Học vấn (KHÔNG ĐƯỢC THIẾU): Quét toàn bộ văn bản để trích xuất Trường học (school), Chuyên ngành (major) và Bằng cấp (degree).
   - ĐỐI VỚI SINH VIÊN/THỰC TẬP: Nếu chưa tốt nghiệp, hãy ghi bằng cấp kèm trạng thái (VD: "Cử nhân (Đang học)", "Kỹ sư (Dự kiến)", "Sinh viên năm 4"). Nếu không rõ bằng cấp, hãy để "Đang học" hoặc "Sinh viên".
4. Exhaustive Extraction: Trích xuất đầy đủ và chi tiết. Giữ nguyên các gạch đầu dòng nhiệm vụ và thành tựu, dịch chúng sang tiếng Việt.
5. Phân biệt Experience và Projects (CỰC KỲ NGHIÊM NGẶT):
   - experience: CHỈ dành cho công việc tại một Pháp nhân (Công ty, Tổ chức, Tập đoàn). Bắt buộc có tên Công ty rõ ràng (VD: Công ty ABC, FPT...). Nếu đơn vị là tên một Sản phẩm/Ứng dụng, KHÔNG được đưa vào đây.
   - projects: Dành cho TOÀN BỘ các sản phẩm, ứng dụng, đồ án, freelancer (VD: "Modish Motion", "iChat", "Web bán hàng"...). 
   - Quy tắc vàng: Nếu ứng viên chưa từng đi làm tại công ty chính thức, mục experience phải trả về mảng rỗng []. Đừng cố gắng biến dự án thành kinh nghiệm đi làm.
6. Catch-all: Đưa các mục khác (Giải thưởng, Hoạt động...) vào "other_info".
7. Phân loại Ngành nghề: Chọn 1-3 ngành từ danh sách hợp lệ bên dưới.
   - DANH SÁCH HỢP LỆ:
${industriesList}

8. Vị trí & Lương mong muốn (Phân tích & Đề xuất): 
   - Nếu CV không ghi địa điểm/lương, AI PHẢI dựa vào năng lực để đề xuất (VD: "Hồ Chí Minh", "15,000,000 - 20,000,000 VND").
   - Vị trí ứng tuyển (jobTitle) phải khớp với kỹ năng mạnh nhất của ứng viên.
9. Skill Levels: 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'.
10. Trả về đúng JSON Schema. Bắt buộc duy nhất khối JSON.
`.trim();

const CV_SCHEMA_TEXT = `
JSON Schema yêu cầu:
{
  "is_cv": boolean,
  "error_message": "string (chỉ điền nếu is_cv là false)",
  "personal_info": { "full_name": "string", "email": "string", "phone": "string", "location": "string", "gpa": "number" },
  "summary": "string",
  "desired_job": { "jobTitle": "string", "jobType": "string", "expectedSalary": "string", "location": "string" },
  "categories": ["string"],
  "education": [{ "degree": "string", "major": "string", "school": "string", "duration": "string" }],
  "certifications": ["string"],
  "languages": [{ "language": "string", "level": "string" }],
  "interests": ["string"],
  "skills": {
    "hard_skills": [{ "skillName": "string", "level": "BEGINNER | INTERMEDIATE | ADVANCED" }],
    "soft_skills": [{ "skillName": "string", "level": "BEGINNER | INTERMEDIATE | ADVANCED" }]
  },
  "experience": {
    "total_months": "number",
    "roles": [{ "job_title": "string", "company_or_project": "string", "duration": "string", "description": "string" }]
  },
  "projects": [{ "projectName": "string", "description": "string", "role": "string", "technology": "string" }],
  "other_info": [{ "header": "string", "content": "string" }]
}
`;

@Injectable()
export class CvParsingService {
  private readonly logger = new Logger(CvParsingService.name);
  private groqApiKey: string | null = null;

  constructor(private readonly configService: ConfigService) {
    // Config Groq
    this.groqApiKey =
      (this.configService.get<string>('GROQ_API_KEY') ||
      process.env.GROQ_API_KEY ||
      '').trim() || null;

    if (this.groqApiKey) {
      this.logger.log('Đã cấu hình Groq API cho CV Parsing.');
    }
  }

  async extractTextLocal(buffer: Buffer, mimeType: string): Promise<string> {
    try {
      let text = '';
      if (mimeType === 'application/pdf') {
        this.logger.log(`[CV Parsing] Bắt đầu xử lý PDF (Buffer size: ${buffer.length} bytes)`);
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        text = data.text || '';
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword'
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value || '';
      } else if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
        text = buffer.toString('utf8');
      }

      return this.sanitizeRawText(text);
    } catch (error: any) {
      this.logger.error(`Lỗi bóc tách văn bản local (${mimeType}): ${error.message}`);
      return '';
    }
  }

  /**
   * Option C: Tiền xử lý văn bản thô để giảm token rác
   */
  private sanitizeRawText(text: string): string {
    if (!text) return '';

    return text
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '') // Loại bỏ control chars
      .replace(/\s+/g, ' ') // Gom nhóm khoảng trắng, newline thành 1 space
      .replace(/\n+/g, ' ')
      .trim()
      .substring(0, 10000); // Giới hạn 10k ký tự (~2500 tokens) để bảo vệ hạn mức
  }

  /**
   * Option A: Cắt tỉa danh sách ngành nghề dựa trên từ khóa thực tế trong CV
   */
  private getRelevantIndustries(text: string): string {
    const lowerText = text.toLowerCase();
    const relevant = HIERARCHICAL_INDUSTRIES.filter((ind) => {
      // Kiểm tra xem tên ngành hoặc bất kỳ từ khóa nào xuất hiện trong CV không
      const hasCategory = lowerText.includes(ind.category.toLowerCase());
      const hasKeyword = ind.keywords.some((k) => lowerText.includes(k.toLowerCase()));
      return hasCategory || hasKeyword;
    });

    // Nếu không tìm thấy gì, trả về 10 ngành đầu tiên mặc định
    // Nếu có, trả về danh sách đã lọc (giới hạn tối đa 15 ngành để prompt gọn)
    const finalSelection = relevant.length > 0 ? relevant.slice(0, 15) : HIERARCHICAL_INDUSTRIES.slice(0, 10);

    return finalSelection
      .map((i) => `- ${i.category}: ${i.subCategories.join(', ')}`)
      .join('\n');
  }

  private async parseWithGroq(text: string, industriesList: string): Promise<CvParsedData | null> {
    if (!this.groqApiKey) return null;

    try {
      this.logger.log('[CV Parsing] Đang phân tích bằng Groq (Llama-3.3-70b)...');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `${getCvExtractionPrompt(industriesList)}\n\n${CV_SCHEMA_TEXT}`,
            },
            {
              role: 'user',
              content: `NỘI DUNG VĂN BẢN CV:\n${text}`,
            },
          ],
          temperature: 0.1,
          max_tokens: 8192,
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
      const groqErrorDetail = error.response?.data
        ? JSON.stringify(error.response.data)
        : error.message;
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
        cleanText = cleanText
          .replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1')
          .trim();

        // 3. Tìm khối JSON bằng regex (từ { đầu tiên đến } cuối cùng)
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1) {
          const jsonPotential = cleanText.substring(firstBrace, lastBrace + 1);
          return JSON.parse(jsonPotential);
        }

        throw new Error('No JSON structure found');
      } catch (innerError) {
        this.logger.error(
          `Parse JSON failed. Raw response length: ${text.length}`,
        );
        // Log một phần kết quả để debug nhưng không quá dài
        this.logger.debug(
          `Preview: ${text.substring(0, 200)}[...]${text.substring(text.length - 100)}`,
        );
        throw new Error(`AI returned invalid JSON: ${innerError.message}`);
      }
    }
  }

  validateIsCv(text: string): { isValid: boolean; reason?: string } {
    this.logger.log('[Gate 1] Kiểm tra sơ bộ (Sanity Check)...');

    // Hiển thị một đoạn nội dung để người dùng kiểm chứng trong log
    const preview = text ? text.substring(0, 200).replace(/\s+/g, ' ').trim() : 'RỖNG';
    const charCount = text?.length || 0;
    this.logger.log(`[Gate 1] Trích xuất thành công: ${charCount} ký tự. Nội dung: "${preview}..."`);

    if (charCount < 100) {
      this.logger.warn(`[Gate 1] Thất bại: Văn bản quá ngắn (${charCount} ký tự).`);
      return {
        isValid: false,
        reason: `Tệp tin chỉ chứa ${charCount} ký tự văn bản, không đủ nội dung tối thiểu (100) để phân tích CV.`,
      };
    }

    this.logger.log('✅ [Gate 1] Vượt qua vòng kiểm tra sơ bộ.');
    return { isValid: true };
  }

  validateParsedData(data: CvParsedData): {
    isValid: boolean;
    missingFields: string[];
    errorReason?: string;
  } {
    this.logger.log('[Gate 3] Kiểm duyệt Schema dữ liệu...');

    // 3.1 AI Rejection check
    if (data.is_cv === false) {
      return {
        isValid: false,
        missingFields: [],
        errorReason:
          data.error_message || 'Tài liệu không được nhận diện là CV hợp lệ.',
      };
    }

    const missingFields: string[] = [];
    const info = data.personal_info;

    // Các trường bắt buộc tối thiểu
    if (!info?.full_name) missingFields.push('Họ và tên');
    if (!info?.email && !info?.phone)
      missingFields.push('Thông tin liên hệ (Email hoặc SĐT)');

    // Kiểm tra bằng chứng năng lực (ít nhất có 1 trong 3)
    const hasEdu = data.education && data.education.length > 0 && !!data.education[0]?.school;
    const hasExp = (data.experience?.roles?.length || 0) > 0;
    const hasProj = (data.projects?.length || 0) > 0;

    if (!hasEdu && !hasExp && !hasProj) {
      missingFields.push('Kinh nghiệm, Dự án hoặc Học vấn');
    }

    if (missingFields.length > 0) {
      this.logger.warn(`[Gate 3] Thiếu thông tin: ${missingFields.join(', ')}`);
    } else {
      this.logger.log('✅ [Gate 3] Schema hợp lệ.');
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
    };
  }

  async parseCvFromText(text: string): Promise<CvParsedData | null> {
    if (!text || text.length < 50) return null;

    if (!this.groqApiKey) {
      this.logger.error('Groq API Key is not configured. Cannot parse CV.');
      return null;
    }

    // Lọc ngành nghề liên quan để thu nhỏ prompt (Tiết kiệm token)
    const relevantIndustries = this.getRelevantIndustries(text);

    this.logger.log(`[AI Parsing] Gửi văn bản tới Groq...`);
    const groqResult = await this.parseWithGroq(text, relevantIndustries);
    if (groqResult) {
      this.logger.log('✅ [AI Parsing] Groq đã hoàn tất bóc tách.');
      return groqResult;
    }

    this.logger.error('[AI Parsing] Groq parsing không trả về kết quả.');
    return null;
  }

  async parseCv(
    buffer: Buffer,
    mimeType: string = 'application/pdf',
  ): Promise<CvParsedData | null> {
    if (!buffer) return null;

    try {
      this.logger.log(`[CV Parsing] Bắt đầu xử lý file (${mimeType})...`);

      // 1. Bóc tách văn bản thô local
      const rawText = await this.extractTextLocal(buffer, mimeType);
      this.logger.log(`[CV Parsing] Trích xuất local thành công: ${rawText.length} kí tự.`);

      if (!rawText || rawText.length < 50) {
        this.logger.warn(`[CV Parsing] Văn bản trích xuất quá ngắn.`);
        return null;
      }

      // 1.1 Kiểm tra xem có phải là CV không (Gate 2)
      const validation = this.validateIsCv(rawText);
      if (!validation.isValid) {
        throw new Error(validation.reason || 'NOT_A_CV');
      }

      // 2. Phân tích AI
      return this.parseCvFromText(rawText);
    } catch (error: any) {
      this.logger.error(
        `[CV Parsing] Dừng xử lý do lỗi: ${error.message}`,
      );
      if (
        error.message === 'NOT_A_CV' ||
        error.message.includes('thông tin liên hệ') ||
        error.message.includes('nội dung đặc trưng')
      ) {
        throw error;
      }
      return null;
    }
  }
}
