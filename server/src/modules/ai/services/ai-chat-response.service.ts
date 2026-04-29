import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiChatResponseService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiChatResponseService.name);

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  getGenAI() {
    return this.genAI;
  }

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured && !process.env.GROQ_API_KEY) return 'AI is not configured.';

    const normalizedQuery = message.trim().toLowerCase();
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({ where: { query: normalizedQuery } });
      if (cached) return cached.response;
    } catch (e) {
      this.logger.warn(`Failed to read from AI Query cache: ${e}`);
    }

    let responseText = '';
    let success = false;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'Bạn là chuyên gia tư vấn Tuyển Dụng và Nhân Sự (Workly-AI). NGUYÊN TẮC TỐI THƯỢNG: TUYỆT ĐỐI KHÔNG trả lời các chủ đề ngoài lề. Nếu người dùng hỏi ngoài lề, chỉ trả lời duy nhất: "Tôi là Trợ lý AI Tuyển Dụng, tôi chỉ có thể giúp bạn các vấn đề liên quan đến tuyển dụng, tối ưu JD và nhân sự."' },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } },
        );
        responseText = groqRes.data.choices[0].message.content;
        success = true;
      } catch (e: any) {
        this.logger.warn(`[AiChatResponseService] Groq generateResponse failed: ${e.message}. Falling back to Gemini...`);
      }
    }

    if (!success && this.isConfigured) {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: 'Bạn là chuyên gia tư vấn Tuyển Dụng và Nhân Sự. NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG trả lời chủ đề ngoài lề. Nếu hỏi ngoài lề, từ chối và nói bạn chỉ hỗ trợ tuyển dụng.'
          });
          const result = await model.generateContent(message);
          responseText = result.response.text();
          success = true;
          break;
        } catch (e: any) {
          this.logger.warn(`[AiChatResponseService] generateResponse error with ${modelName}.`);
          await SLEEP(500);
        }
      }
    }

    if (!success) return 'Error generating response';

    try {
      await this.prisma.aiQueryCache.create({ data: { query: normalizedQuery, response: responseText } });
    } catch (e) {}

    return responseText;
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    if (!this.isConfigured && !process.env.GROQ_API_KEY) return [];

    const prompt = `Bạn là chuyên gia tuyển dụng. Hãy phân tích câu hỏi của người dùng và trích xuất danh sách các từ khóa tìm kiếm (Job Titles, Skills, Industry) bằng cả tiếng Việt và tiếng Anh để tối ưu kết quả tìm kiếm.
        Input: "${message}"
        Return ONLY a JSON object with a "keywords" array of strings.`;

    let keywords: string[] | null = null;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.1,
            response_format: { type: 'json_object' },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } },
        );
        const parsed = JSON.parse(groqRes.data.choices[0].message.content.replace(/```json|```/g, '').trim());
        keywords = parsed.keywords || [];
      } catch (e: any) {
        this.logger.warn(`[AiChatResponseService] Groq expandSearchQuery failed: ${e.message}. Falling back to Gemini...`);
      }
    }

    if (!keywords && this.isConfigured) {
      const models = ['gemini-flash-latest', 'gemini-2.5-flash'];
      for (const modelId of models) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: 'application/json' } });
          const result = await model.generateContent(prompt);
          const parsed = JSON.parse(result.response.text().replace(/```json|```/g, '').trim());
          keywords = parsed.keywords || [];
          break;
        } catch (error: any) {
          await SLEEP(500);
        }
      }
    }

    return keywords || [];
  }

  async extractJobData(message: string): Promise<{ jobData: any; usedAI: string } | null> {
    const extractionPrompt = `Bạn là hệ thống trích xuất thông tin tuyển dụng. Hãy phân tích đoạn yêu cầu dưới đây và chuyển thành JSON.
        Yêu cầu: "${message}"
        Quy tắc: (Tiêu đề chuyên nghiệp, jobType, salary, hardSkills, softSkills, autoInviteMatches, description, requirements, benefits chi tiết Markdown).
        Chỉ trả về chuỗi JSON hợp lệ.`;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: 'You are an elite HR Recruiter API. You MUST output extremely long, highly detailed, and professional job descriptions in Vietnamese.' },
              { role: 'user', content: extractionPrompt },
            ],
            temperature: 0.2,
            response_format: { type: 'json_object' },
          },
          { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' } },
        );
        return { jobData: JSON.parse(groqResponse.data.choices[0].message.content.replace(/```json|```/gi, '').trim()), usedAI: 'Groq AI (Llama-3.3-70B)' };
      } catch (error) {}
    }

    if (this.isConfigured) {
      const geminiModels = ['gemini-flash-latest', 'gemini-1.5-flash'];
      for (const modelId of geminiModels) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: 'application/json' } });
          const result = await model.generateContent(extractionPrompt);
          return { jobData: JSON.parse(result.response.text().replace(/```json|```/gi, '').trim()), usedAI: `Google Gemini (${modelId})` };
        } catch (error) {}
      }
    }

    return null;
  }
}
