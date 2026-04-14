import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Bóc text từ buffer PDF dùng pdfjs-dist */
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
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
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + ' \n';
    }
    return fullText;
  } catch (error) {
    throw new Error('Failed to parse PDF using pdfjs: ' + error.message);
  }
}
import { SearchService } from '../search/search.service';
const pdfParse = require('pdf-parse');

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;

  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    } else {
      console.warn('GEMINI_API_KEY is not configured.');
    }
  }

  async extractTextFromLocalFile(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const absolutePath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(absolutePath)) return '';

      const dataBuffer = fs.readFileSync(absolutePath);
      return await parsePdfBuffer(dataBuffer);
    } catch (e) {
      console.error('Error parsing local PDF:', e.message);
      return '';
    }
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      return await parsePdfBuffer(Buffer.from(response.data));
    } catch (e) {
      console.error('Error fetching/parsing PDF:', e.message);
      return '';
    }
  }

  async evaluateMatch(
    cvText: string,
    jobTitle: string,
    jobRequirements: string,
  ): Promise<number> {
    if (!this.isConfigured)
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1));

    // Quick circuit breaker if cv is empty
    if (!cvText || cvText.trim().length === 0) return 30;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
      });

      const prompt = `You are a strict HR AI Assistant. Evaluate the candidate's CV against the Job Title and Job Requirements.
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}
      Candidate CV Text: ${cvText.substring(0, 15000)}
      
      Evaluate their relevant skills, experience years, and degree.
      Return ONLY a JSON response in the following format (no markdown, no backticks, no extra text):
      {"score": 85}
      
      Score should be an integer from 10 to 99 based on how well the CV matches the specific requirements. Unrelated CVs should score low (10-30).`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanResponse = responseText
        .replace(/```json/gi, '')
        .replace(/```/gi, '')
        .trim();
      const parsed = JSON.parse(cleanResponse);
      const score = Number(parsed.score);

      return isNaN(score) ? 50 : score;
    } catch (e) {
      console.error('AI Match Error:', e.message);
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1)); // Fallback
    }
  }

  async extractFocusSkills(jobTitle: string, jobRequirements: string): Promise<string[]> {
    if (!this.isConfigured) return [];
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      const prompt = `Extract exactly 3 core "Focus Skills" (Kỹ năng trọng tâm) for the following job in Vietnamese. Return ONLY a JSON array of strings. Example: ["ReactJS", "NodeJS", "TypeScript"].
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanResponse = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanResponse);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
      return [];
    } catch (e) {
      console.error('AI Focus Skills Error:', e.message);
      return [];
    }
  }

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured) return 'AI is not configured.';
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-flash-latest',
      });
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (e) {
      console.error('generateResponse error:', e);
      return 'Error generating response';
    }
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.processChatWithRAGStream(message, { userId });
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        yield chunk;
      } else {
        // Gửi các action payload dưới dạng JSON bọc trong chuỗi để SSE có thể truyền tải
        yield `__ACTION__:${JSON.stringify(chunk)}`;
      }
    }
  }

  /**
   * Truy xuất ngữ cảnh ứng viên từ database (CV, Kỹ năng, Học vấn)
   */
  async getCandidateRagContext(userId: string): Promise<string> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
        include: {
          skills: true,
          cvs: {
            where: { isMain: true },
            take: 1,
          },
        },
      });

      if (!candidate) return '';

      let context = `\n--- [VỀ ỨNG VIÊN] ---\n`;
      context += `+ Thông tin chính: ${candidate.fullName} - Chuyên ngành ${candidate.major || 'N/A'}\n`;
      context += `+ Kỹ năng (Hệ thống ghi nhận): ${candidate.skills.map((s) => s.skillName).join(', ')}\n`;

      const mainCv = candidate.cvs[0];
      if (mainCv && mainCv.parsedData) {
        const data = mainCv.parsedData as any;
        context += `\n--- [DỮ LIỆU CV THAM KHẢO] ---\n`;
        context += `+ Tóm tắt CV: "${data.summary || ''}"\n`;
        context += `+ Kỹ năng trích xuất: ${JSON.stringify(data.skills || [])}\n`;
        context += `+ Kinh nghiệm: ${JSON.stringify(data.experience || [])}\n`;
      }
      context += `\n--- [LƯU Ý QUAN TRỌNG]: Dữ liệu CV có thể đã cũ. Nếu người dùng cung cấp thông tin mới trong trò chuyện, hãy ưu tiên thông tin đó. ---\n`;

      return context;
    } catch (e) {
      this.logger.error(`Lỗi khi lấy Candidate Context: ${e.message}`);
      return '';
    }
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    if (!this.isConfigured) return [];
    
    // Thử với danh sách model ưu tiên
    const models = ['gemini-flash-latest', 'gemini-2.0-flash'];
    let lastError: any = null;

    for (const modelId of models) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelId });
        const prompt = `Bạn là chuyên gia tuyển dụng. Hãy phân tích câu hỏi của người dùng và trích xuất danh sách các từ khóa tìm kiếm (Job Titles, Skills, Industry) bằng cả tiếng Việt và tiếng Anh để tối ưu kết quả tìm kiếm.
        
        Ví dụ: "Tìm việc kế toán" -> ["kế toán", "accountant", "audit", "finance"]
        Ví dụ: "Tuyển ReactJS ở Hà Nội" -> ["reactjs", "frontend", "web developer", "javascript"]
        
        Input: "${message}"
        Return ONLY a JSON array of strings.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return JSON.parse(text.replace(/```json|```/g, '').trim());
      } catch (error: any) {
        lastError = error;
        // Nếu lỗi 503 hoặc 429, thử model tiếp theo
        this.logger.warn(`Model ${modelId} lỗi (${error.status || 'unknown'}). Thử model tiếp theo...`);
        await SLEEP(500);
      }
    }

    this.logger.error(`Tất cả model expandSearchQuery đều lỗi: ${lastError?.message}`);
    return [];
  }

  async *processChatWithRAGStream(
    message: string,
    context?: { cvText?: string; userId?: string },
  ): AsyncGenerator<any, void, unknown> {
    if (!this.isConfigured) {
      yield 'Hệ thống AI chưa được cấu hình (Thiếu API Key).';
      return;
    }

    const models = ['gemini-flash-latest', 'gemini-2.0-flash'];
    let success = false;
    let lastError: any = null;

    for (const modelId of models) {
      if (success) break;
      
      try {
        const model = this.genAI.getGenerativeModel({ model: modelId });

        let ragContext = '';

        // 1. Nếu có userId, lấy thông tin CV/Profile từ DB (Pillar: User Context)
        if (context?.userId) {
          const userContext = await this.getCandidateRagContext(context.userId);
          if (userContext) {
            ragContext += userContext;
          }
        }

        // 2. Phân tích ý định tìm việc
        const userMessage = message.toLowerCase();
        const isJobSearch =
          userMessage.includes('tìm') ||
          userMessage.includes('việc') ||
          userMessage.includes('job') ||
          userMessage.includes('tuyển') ||
          userMessage.includes('gợi ý');

        if (isJobSearch) {
          const expandedKeywords = await this.expandSearchQuery(message);
          
          const jobs = await this.searchService.searchJobsForRAG({
            search: message,
            expandedKeywords: expandedKeywords,
            limit: 3,
          });

          if (jobs && jobs.length > 0) {
            ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP (Market Data) ---\n${JSON.stringify(jobs)}\n`;
            yield { type: 'SHOW_JOB_CARDS', payload: jobs };
          }
        }

        const systemPrompt = `Bạn là Workly-AI, SIÊU CỐ VẤN TUYỂN DỤNG chuyên nghiệp.
        
        NGỮ CẢNH DỮ LIỆU:
        ${ragContext || 'Chưa nhận diện được ứng viên/JD cụ thể.'}

        NGUYÊN TẮC VÀNG (MANDATORY):
        1. **BỎ Filler**: Tuyệt đối không dùng "Dựa trên hồ sơ của bạn", "Với nền tảng là...". Hãy nói trực tiếp như một người cố vấn thực thụ. 
        2. **Ưu tiên "Hiện tại"**: Nếu thông tin trong chat (VD: TOEIC 800) mâu thuẫn với CV (VD: TOEIC 700), hãy ưu tiên thông tin từ chat và lịch sự nhắc người dùng cập nhật lại CV.
        3. **Súc tích & Markdown**: Trả lời ngắn, chia bullet points, in đậm từ khóa quan trọng. Tối đa 120 từ.
        4. **Guardrails**: Từ chối chủ đề ngoài lề (Toán, Thời tiết, Chính trị...) bằng 1 câu ngắn gọn và quay lại ngay chủ đề sự nghiệp.

        Câu hỏi từ người dùng: ${message}`;

        const result = await model.generateContentStream(systemPrompt);
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) yield text;
        }
        
        success = true; // Đã xong và thành công
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Model ${modelId} stream error: ${error.message}. Thử model tiếp theo...`);
        await SLEEP(500);
      }
    }

    if (!success) {
      this.logger.error(`Tất cả model AI đều lỗi: ${lastError?.message}`);
      yield "\n[Hệ thống]: Hiện tại máy chủ trí tuệ nhân tạo đang rất bận (Quá tải). Bạn hãy thử lại sau ít phút hoặc nhấn Gửi lại nhé!";
    }
  }
}
