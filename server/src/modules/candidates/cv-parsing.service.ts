import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  SchemaType,
  GenerativeModel,
} from '@google/generative-ai';
import { CvParsedData } from './interfaces/cv-parsing.interface';
import * as path from 'path';

const CV_EXTRACTION_PROMPT = (rawText: string) =>
  `
Bạn là một chuyên gia nhân sự (HR) cấp cao và chuyên gia bóc tách dữ liệu hồ sơ (CV Parsing).
Hãy phân tích đoạn văn bản thô từ CV dưới đây và trích xuất thông tin một cách chính xác nhất.

Yêu cầu:
1. Chỉ trả về dữ liệu thuần túy dưới dạng JSON theo đúng schema.
2. Tuyệt đối không giải thích hoặc thêm văn bản ngoài JSON.
3. Nếu không tìm thấy thông tin cho một trường, hãy để giá trị mặc định (chuỗi trống, mảng trống, hoặc 0).
4. Chuẩn hóa các kỹ năng thành các từ khóa ngắn gọn (VD: "Expert in ReactJS" -> "ReactJS").
5. **BẮT BUỘC**: Trường "summary" (giới thiệu bản thân) và trường "description" trong mỗi mục kinh nghiệm (mô tả công việc) PHẢI được viết hoàn toàn bằng tiếng Việt. Nếu nội dung gốc bằng tiếng Anh, hãy dịch sang tiếng Việt tự nhiên và chuyên nghiệp trước khi trả về.
6. **Phân tích cấp độ kỹ năng**: Đối với mỗi kỹ năng, hãy đánh giá cấp độ dựa trên ngữ cảnh:
   - **BEGINNER**: Mới học, kiến thức nền tảng, hoặc kinh nghiệm < 1 năm.
   - **INTERMEDIATE**: Đã làm nhiều dự án, hiểu sâu vấn đề, hoặc kinh nghiệm 1-3 năm.
   - **ADVANCED**: Chuyên gia, có khả năng tối ưu hóa, mentor, hoặc kinh nghiệm > 3 năm.
7. **Phân biệt Dự án và Kinh nghiệm**:
   - **Experience**: Chỉ dành cho công việc làm tại các công ty, tổ chức (Work at companies).
   - **Projects**: Dành cho đồ án, dự án cá nhân, dự án tự do (Side projects, academic projects).
8. **Học vấn**: Trích xuất chi tiết lịch sử học vấn vào mảng 'education'.

Văn bản CV:
${rawText}
`.trim();

const CV_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    fullName: {
      type: SchemaType.STRING,
      description: 'Họ và tên đầy đủ của ứng viên.',
    },
    email: { type: SchemaType.STRING, description: 'Địa chỉ email liên hệ.' },
    phone: { type: SchemaType.STRING, description: 'Số điện thoại liên hệ.' },
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          skillName: { type: SchemaType.STRING, description: 'Tên kỹ năng.' },
          level: {
            type: SchemaType.STRING,
            description:
              'Mức độ thành thạo: BEGINNER, INTERMEDIATE, hoặc ADVANCED.',
          },
        },
        required: ['skillName', 'level'],
      },
      description: 'Danh sách các kỹ năng kèm theo mức độ thành thạo.',
    },
    experience: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          company: {
            type: SchemaType.STRING,
            description: 'Tên công ty/tổ chức.',
          },
          role: {
            type: SchemaType.STRING,
            description: 'Chức danh/Vị trí công việc.',
          },
          duration: {
            type: SchemaType.STRING,
            description:
              "Thời gian làm việc (ví dụ: '6 tháng', '2 năm', '01/2020 - 05/2023').",
          },
          description: {
            type: SchemaType.STRING,
            description:
              'Mô tả ngắn gọn công việc, PHẢI bằng tiếng Việt. Nếu gốc là tiếng Anh hãy dịch sang tiếng Việt.',
          },
        },
        required: ['company', 'role', 'duration'],
      },
    },
    education: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          school: {
            type: SchemaType.STRING,
            description: 'Tên trường học/cơ sở đào tạo.',
          },
          degree: {
            type: SchemaType.STRING,
            description: 'Bằng cấp (VD: Cử nhân, Thạc sĩ).',
          },
          major: { type: SchemaType.STRING, description: 'Chuyên ngành học.' },
        },
        required: ['school', 'degree', 'major'],
      },
    },
    totalYearsExp: {
      type: SchemaType.NUMBER,
      description: 'Tổng số năm kinh nghiệm làm việc tích lũy.',
    },
    summary: {
      type: SchemaType.STRING,
      description:
        'Bản tóm tắt ngắn gọn về ứng viên (Profile Summary), PHẢI bằng tiếng Việt. Nếu gốc là tiếng Anh hãy dịch sang tiếng Việt.',
    },
    gpa: {
      type: SchemaType.NUMBER,
      description: 'Điểm trung bình tích lũy (GPA). Nếu CV không có hãy để 0.',
    },
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          projectName: { type: SchemaType.STRING, description: 'Tên dự án.' },
          role: {
            type: SchemaType.STRING,
            description: 'Vai trò trong dự án.',
          },
          description: {
            type: SchemaType.STRING,
            description: 'Mô tả dự án, PHẢI bằng tiếng Việt.',
          },
          technology: {
            type: SchemaType.STRING,
            description: 'Công nghệ sử dụng (VD: React, Node.js).',
          },
        },
        required: ['projectName', 'description'],
      },
      description: 'Danh sách hồ sơ dự án cá nhân hoặc học thuật.',
    },
  },
  required: [
    'fullName',
    'email',
    'phone',
    'skills',
    'experience',
    'education',
    'totalYearsExp',
  ],
};

@Injectable()
export class CvParsingService {
  private readonly logger = new Logger(CvParsingService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel(
        {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CV_SCHEMA as any,
          },
        },
        { apiVersion: 'v1beta' },
      );
      this.logger.log(
        'Đã khởi tạo thành công Gemini 2.5 Flash cho CV Parsing.',
      );
    }
  }

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
      const standardFontDataUrl =
        path
          .join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')
          .replace(/\\/g, '/') + '/';

      const data = new Uint8Array(buffer);
      const pdf = await pdfjsLib.getDocument({
        data: data,
        standardFontDataUrl: standardFontDataUrl,
      }).promise;

      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' \n';
      }
      return fullText;
    } catch (error) {
      this.logger.error(`Lỗi khi parse PDF bằng pdfjs: ${error.message}`);
      throw new Error(`Failed to parse PDF using pdfjs: ${error.message}`);
    }
  }

  async parseCv(rawText: string, retryCount = 0): Promise<CvParsedData | null> {
    if (!this.model || !rawText) return null;

    let targetModel = this.model;
    // Fallback to older stable model on higher retries if demand is too high
    if (retryCount >= 2 && this.genAI) {
      targetModel = this.genAI.getGenerativeModel(
        {
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: CV_SCHEMA as any,
          },
        },
        { apiVersion: 'v1beta' },
      );
      this.logger.warn(
        `Switching to fallback model (gemini-2.5-flash) for retry ${retryCount}`,
      );
    }

    try {
      const result = await targetModel.generateContent(
        CV_EXTRACTION_PROMPT(rawText),
      );
      const response = await result.response;
      let text = response.text();

      // Cleanup markdown artifacts just in case
      if (text.startsWith('```json')) {
        text = text
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
      }

      return JSON.parse(text) as CvParsedData;
    } catch (error) {
      const isOverloaded =
        error.status === 503 ||
        error.message?.includes('503') ||
        error.message?.includes('high demand') ||
        error.message?.includes('429');

      if (isOverloaded && retryCount < 3) {
        const waitTime = (retryCount + 1) * 2000; // 2s, 4s, 6s
        this.logger.warn(
          `API is experiencing high demand (${error.message}). Retrying in ${waitTime}ms... (Attempt ${retryCount + 1}/3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        return this.parseCv(rawText, retryCount + 1);
      }

      this.logger.error(`Lỗi khi gọi Gemini AI để parse CV: ${error.message}`);
      return null;
    }
  }
}
