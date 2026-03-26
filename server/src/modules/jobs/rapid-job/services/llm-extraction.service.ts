import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, SchemaType, GenerativeModel } from '@google/generative-ai';

import { LlmExtractedData } from '../interfaces/rapid-job.interface';

const EXTRACTION_PROMPT = (rawDescription: string) => `
Bạn là một chuyên gia nhân sự (HR). Hãy đọc kỹ phần mô tả công việc dưới đây và trích xuất tất cả thông tin quan trọng.
Chỉ trả về Data thuần tuý dưới dạng JSON, tuyệt đối không giải thích thêm.

Văn bản gốc:
${rawDescription}
`.trim();

const EXTRACTION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    description: { type: SchemaType.STRING, description: "TÓM TẮT ngắn gọn nhiệm vụ công việc chính (không quá 500 ký tự). Loại bỏ yêu cầu và quyền lợi.", nullable: true },
    requirements: { type: SchemaType.STRING, description: "Các yêu cầu đối với ứng viên, mỗi yêu cầu trên một dòng bắt đầu bằng ký tự •.", nullable: true },
    benefits: { type: SchemaType.STRING, description: "Quyền lợi và chế độ đãi ngộ, mỗi dòng bắt đầu bằng ký tự •.", nullable: true },
    salaryMin: { type: SchemaType.NUMBER, description: "Lương tối thiểu (số nguyên).", nullable: true },
    salaryMax: { type: SchemaType.NUMBER, description: "Lương tối đa (số nguyên).", nullable: true },
    experience: { type: SchemaType.STRING, description: "Kinh nghiệm yêu cầu (VD: '1 năm', '6 tháng', 'Không yêu cầu').", nullable: true },
    vacancies: { type: SchemaType.NUMBER, description: "Số lượng tuyển dụng. Mặc định là 1 nếu không đề cập.", nullable: true },
    deadline: { type: SchemaType.STRING, description: "Thời hạn nộp hồ sơ, định dạng YYYY-MM-DD.", nullable: true },
    companyDescription: { type: SchemaType.STRING, description: "Đoạn văn giới thiệu tổng quan về công ty (Nếu có). Loại bỏ thông tin PR rác.", nullable: true },
    companySize: { type: SchemaType.NUMBER, description: "Quy mô số lượng nhân sự công ty. Chỉ lấy số nguyên lớn nhất (VD: 1000).", nullable: true }
  },
  required: [
    "description", "requirements", "benefits", "salaryMin", 
    "salaryMax", "experience", "vacancies", "deadline", 
    "companyDescription", "companySize"
  ]
};

@Injectable()
export class LlmExtractionService {
  private readonly logger = new Logger(LlmExtractionService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel(
        {
          model: 'gemini-1.5-flash-latest',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: EXTRACTION_SCHEMA as any,
          },
        },
        { apiVersion: 'v1beta' },
      );
      this.logger.log('Đã khởi tạo thành công Gemini 1.5 Flash Latest (@google/generative-ai).');
    } else {
      this.logger.warn('Chưa cấu hình GEMINI_API_KEY. Tính năng trích xuất AI bị vô hiệu hóa.');
    }
  }

  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;
  private readonly DELAY_MS = 1000; // Tăng lên 1s để an toàn cho Free Tier

  async extract(rawDescription: string): Promise<LlmExtractedData | null> {
    if (!rawDescription || rawDescription.trim().length < 50 || !this.model) {
      return null;
    }

    return new Promise<LlmExtractedData | null>((resolve) => {
      this.requestQueue.push(async () => {
        resolve(await this.doExtract(rawDescription));
      });
      void this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    while (this.requestQueue.length > 0) {
      const task = this.requestQueue.shift()!;
      await task();
      if (this.requestQueue.length > 0) {
        await new Promise((r) => setTimeout(r, this.DELAY_MS));
      }
    }
    this.isProcessing = false;
  }

  private async doExtract(rawDescription: string): Promise<LlmExtractedData | null> {
    try {
      const result = await this.model!.generateContent(EXTRACTION_PROMPT(rawDescription));
      const response = await result.response;
      const text = response.text();
      
      if (!text) throw new Error('Phản hồi từ LLM trống');
      
      const parsed = JSON.parse(text) as LlmExtractedData;
      this.logger.debug(`[AI] Trích xuất dữ liệu thành công qua @google/generative-ai`);
      return parsed;
    } catch (error) {
      this.logger.warn(`[AI] Trích xuất thất bại: ${error?.message ?? error}`);
      return null;
    }
  }
}
