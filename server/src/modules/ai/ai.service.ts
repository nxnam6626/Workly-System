import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import axios from 'axios';
import { AiPdfService } from './ai-pdf.service';
import { AiMatchingService } from './ai-matching.service';
import { AiModerationService } from './ai-moderation.service';
import { AiInsightsService } from './ai-insights.service';
import { AiChatService } from './ai-chat.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly aiPdfService: AiPdfService,
    private readonly aiMatchingService: AiMatchingService,
    private readonly aiModerationService: AiModerationService,
    private readonly aiInsightsService: AiInsightsService,
    private readonly aiChatService: AiChatService,
    private readonly prisma: PrismaService,
    @InjectQueue('matching') private readonly matchingQueue: Queue,
  ) {
    this.logger.log('AiService Facade initialized');
  }

  // =====================================================
  // 1. CHAT ATTACHMENT MODERATION & EXTRACTION
  // =====================================================
  async moderateChatImageBuffer(buffer: Buffer, mimeType: string) {
    return this.aiModerationService.moderateChatImageBuffer(buffer, mimeType);
  }

  async extractTextFromBuffer(buffer: Buffer, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return this.aiPdfService.extractTextFromBuffer(buffer, mimeType);
    }
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword'
    ) {
      try {
        const mammoth = require('mammoth');
        const result = await mammoth.extractRawText({ buffer });
        return result.value || '';
      } catch (e) {
        this.logger.error('Mammoth extraction failed: ' + e.message);
        return '';
      }
    }
    return '';
  }

  // =====================================================
  // 1.5. PDF EXTRACTION
  // =====================================================
  async extractTextFromLocalFile(fileUrl: string): Promise<string> {
    return this.aiPdfService.extractTextFromLocalFile(fileUrl);
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    return this.aiPdfService.extractTextFromPdfUrl(fileUrl);
  }

  // =====================================================
  // 2. MATCHING & KEYWORDS
  // =====================================================
  async evaluateMatch(
    cvText: string,
    jobTitle: string,
    jobRequirements: string,
  ): Promise<number> {
    return this.aiMatchingService.evaluateMatch(
      cvText,
      jobTitle,
      jobRequirements,
    );
  }

  async extractFocusSkills(
    jobTitle: string,
    jobRequirements: string,
  ): Promise<string[]> {
    return this.aiMatchingService.extractFocusSkills(jobTitle, jobRequirements);
  }

  async expandJobKeywords(
    jobTitle: string,
    hardSkills: string[],
  ): Promise<Record<string, string[]>> {
    return this.aiMatchingService.expandJobKeywords(jobTitle, hardSkills);
  }

  // =====================================================
  // 3. RECUIRETER INSIGHTS
  // =====================================================
  async generateRecruiterInsights(userId: string, forceRefresh: boolean = false): Promise<any> {
    return this.aiInsightsService.generateRecruiterInsights(userId, forceRefresh);
  }

  // =====================================================
  // 4. MODERATION
  // =====================================================
  async moderateJobContent(
    title: string,
    description: string,
    requirements?: string,
    benefits?: string,
    hardSkills?: string[],
    jobTier?: string, // Thêm jobTier
  ): Promise<{
    score: number;
    safe: boolean;
    flags: string[];
    reason: string;
    usedAI: boolean;
    feedback?: string[] | string;
  }> {
    return this.aiModerationService.moderateJobContent(
      title,
      description,
      requirements,
      benefits,
      hardSkills,
      jobTier,
    );
  }

  async moderateImage(
    imageInput: string,
    mimeType?: string,
    expectedType?: 'face_only' | 'face_or_logo' | 'any',
  ): Promise<{ safe: boolean; reason: string; usedAI: boolean }> {
    return this.aiModerationService.moderateImage(
      imageInput,
      mimeType,
      expectedType,
    );
  }

  // =====================================================
  // 5. CHAT & RAG
  // =====================================================
  async generateResponse(message: string): Promise<string> {
    return this.aiChatService.generateResponse(message);
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
    roles?: string[],
    contextMode?: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.aiChatService.generateStreamResponse(
      message,
      userId,
      roles,
      contextMode,
    );
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async getCandidateRagContext(userId: string): Promise<string> {
    return this.aiChatService.getCandidateRagContext(userId);
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    return this.aiChatService.expandSearchQuery(message);
  }

  async *processChatWithRAGStream(
    message: string,
    context?: {
      cvText?: string;
      userId?: string;
      roles?: string[];
      contextMode?: string;
    },
  ): AsyncGenerator<any, void, unknown> {
    const stream = this.aiChatService.processChatWithRAGStream(
      message,
      context,
    );
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async autoFixJob(userId: string, jobId: string, insightInstruction: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter || recruiter.recruiterSubscription?.planType !== 'GROWTH' || !recruiter.companyId) {
      throw new Error('Tính năng Sửa Tự Động bằng AI chỉ dành cho tài khoản GROWTH thuộc công ty.');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: { jobPostingId: jobId, companyId: recruiter.companyId },
    });

    if (!job) {
      throw new Error('Không tìm thấy tin tuyển dụng hoặc không có quyền.');
    }

    const currentStruct = (job.structuredRequirements as any) || {};
    if (currentStruct.autoFixedByAI) {
      throw new Error('Tin tuyển dụng này đã được AI tự động sửa 1 lần, không thể sửa tự động lại.');
    }

    const prompt = `Bạn là AI chuyên tối ưu Job Description (JD). Dưới đây là thông tin JD hiện tại:
Tiêu đề: ${job.title}
Mô tả: ${job.description || ''}
Yêu cầu: ${job.requirements || ''}
Quyền lợi: ${job.benefits || ''}

Hãy SỬA ĐỔI JD này dựa trên CỐ VẤN sau: "${insightInstruction}"
**Lưu ý quan trọng**: Giữ nguyên thông tin không liên quan đến cố vấn. 
**BẮT BUỘC**: 
1. Sử dụng thẻ HTML chuẩn (\`<ul>\`, \`<li>\`, \`<p>\`, \`<strong>\`, \`<br>\`) để định dạng văn bản. TUYỆT ĐỐI KHÔNG dùng Markdown (\`*\`, \`**\`, \`#\`) vì frontend sẽ render bằng HTML. Các đầu mục phải dùng thẻ \`<ul><li>...\</li></ul>\` để hiển thị xuống dòng đẹp mắt.
2. TUYỆT ĐỐI KHÔNG sử dụng emoji, icon hay bất kỳ ký tự biểu tượng cảm xúc nào (như 🚀, ✅, 🌟, v.v.). Văn phong phải cực kỳ chuyên nghiệp và trang trọng.
3. SỬ DỤNG 100% TIẾNG VIỆT CHÍNH TẢ CHUẨN MỰC. TUYỆT ĐỐI KHÔNG sử dụng tiếng Trung, tiếng Nhật hoặc các ngôn ngữ khác (ngoại trừ thuật ngữ chuyên ngành IT/Tiếng Anh bắt buộc). Mọi phân tích hay câu chữ sinh ra phải viết trực tiếp bằng tiếng Việt có dấu hoàn chỉnh.
TRẢ VỀ DUY NHẤT một chuỗi JSON chuẩn với format sau (không markdown block, không chú thích thêm):
{
  "title": "Tiêu đề mới (nếu cần đổi)",
  "description": "Mô tả đã tối ưu",
  "requirements": "Yêu cầu đã tối ưu",
  "benefits": "Quyền lợi đã tối ưu"
}
`;

    // 🥇 Priority 1: Groq
    let aiResponse = '';
    let success = false;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an HR JD Editor. Always reply ONLY in perfectly fluent Vietnamese. Always return JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        aiResponse = groqRes.data.choices[0].message.content;
        if (aiResponse) success = true;
      } catch (e: any) {
        this.logger.warn(`Groq autoFixJob failed: ${e.message}`);
      }
    }

    // 🥈 Priority 2: Gemini
    if (!success) {
      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
        'gemini-2.0-flash'
      ];
      for (const modelId of modelsToTry) {
        if (success) break;
        try {
          const model = this.aiChatService['genAI'].getGenerativeModel({ model: modelId, generationConfig: { responseMimeType: "application/json" } });
          const result = await model.generateContent(prompt);
          aiResponse = result.response.text();
          if (aiResponse) success = true;
        } catch (e) {
          // try next
        }
      }
    }

    if (!success || !aiResponse) {
      throw new Error('Không thể sử dụng AI lúc này, vui lòng thử lại sau.');
    }

    try {
      const parsed = JSON.parse(aiResponse);
      const updatedStruct = { ...currentStruct, autoFixedByAI: true, isAiGenerated: true };

      const newTitle = parsed.title || job.title;
      const newDesc = parsed.description || job.description;
      const newReq = parsed.requirements || job.requirements;
      const newBen = parsed.benefits || job.benefits;

      // Run automatic moderation
      const modResult = await this.aiModerationService.moderateJobContent(
        newTitle,
        newDesc,
        newReq,
        newBen,
        ((job.structuredRequirements as any)?.hardSkills) || [],
        job.jobTier
      );

      const finalStatus = (modResult.safe && modResult.score >= 50) ? 'APPROVED' : 'PENDING';

      await this.prisma.$transaction([
        this.prisma.jobPosting.update({
          where: { jobPostingId: jobId },
          data: {
            title: newTitle,
            description: newDesc,
            requirements: newReq,
            benefits: newBen,
            status: finalStatus,
            structuredRequirements: updatedStruct,
          },
        }),
        this.prisma.recruiter.update({
          where: { recruiterId: recruiter.recruiterId },
          data: { aiInsightsCacheKey: null },
        })
      ]);

      // Trigger matching for the updated job
      try {
        await this.matchingQueue.add('match', { jobId });
      } catch (err) {
        this.logger.warn(`Failed to trigger matching queue for job ${jobId}: `, err);
      }

      return { success: true, message: 'Cập nhật JD thành công' };
    } catch (e) {
      throw new Error('AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.');
    }
  }
  async generateJdFromPrompt(userId: string, promptInfo: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter || !recruiter.recruiterSubscription?.planType) {
      throw new ForbiddenException('Tính năng Viết JD tự động chỉ hỗ trợ với tài khoản VIP (LITE hoặc GROWTH).');
    }

    const extractionPrompt = `Bạn là hệ thống trích xuất thông tin tuyển dụng. Hãy phân tích đoạn yêu cầu dưới đây và chuyển thành JSON.
        
        Yêu cầu: "${promptInfo}"
        
        Quy tắc:
        - title: Tiêu đề công việc cực kỳ chuyên nghiệp. BẮT BUỘC giữ nguyên các role chuẩn ngành IT bằng Tiếng Anh (Ví dụ: "Backend Developer", "Frontend Engineer", "Data Analyst") thay vì dịch máy móc sang Tiếng Việt như "Nhân viên phát triển...". Chỉ dùng Tiếng Việt khi danh xưng đủ sang trọng (VD: "Trưởng phòng Marketing", "Chuyên viên Phân tích Dữ liệu").
        - jobType: "FULLTIME", "PARTTIME", hoặc "REMOTE" (mặc định FULLTIME).
        - salaryMin: Lương thấp nhất (số nguyên, e.g. 10000000) (nếu nói 10tr -> 10000000). Trả về 0 nếu không có.
        - salaryMax: Lương cao nhất (số nguyên, e.g. 20000000). Trả về 0 nếu không có.
        - vacancies: Số lượng tuyển (số nguyên, mặc định 1).
        - experience: Yêu cầu kinh nghiệm bằng chữ (e.g. "1 - 2 năm").
        - minExperienceYears: Số năm tối thiểu dạng số (e.g. 1). Default: 0.
        - hardSkills: Mảng các kỹ năng chuyên môn (công cụ, ngôn ngữ lập trình, hệ thống) dạng text cực kỳ ngắn gọn và ĐẬM CHẤT KỸ THUẬT. TUYỆT ĐỐI KHÔNG dịch thuật ngữ IT sang Tiếng Việt (Ví dụ: KHÔNG dùng "Lập trình Java" hay "Kiến thức thiết kế phần mềm", PHẢI TRẢ VỀ CHUẨN là "Java", "Software Architecture", "Database/SQL").
        - softSkills: Mảng các kỹ năng mềm chuẩn mực doanh nghiệp. Hạn chế dùng từ quá chung chung, ưu tiên từ đắt giá (e.g. ["Problem Solving", "Tư duy phản biện", "Khả năng chịu áp lực", "Giao tiếp linh hoạt"]).
        - autoInviteMatches: Bật tính năng tìm ứng viên tự động. (boolean)
        - description: Mô tả công việc cực kỳ chi tiết rành mạch bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng (bullet points) giải thích rõ ràng các nhiệm vụ hàng ngày. Văn phong PHẢI cực kỳ chuyên nghiệp và trang trọng. TUYỆT ĐỐI KHÔNG dùng bất kỳ biểu tượng cảm xúc (emoji) hay sticker nào. Tự sinh (generate) nội dung thật dài và đầy đủ dựa theo chức danh (title) công việc.
        - requirements: Yêu cầu ứng viên cực kỳ chi tiết bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng về chuyên môn, bằng cấp, kỹ năng mềm và thái độ. Tự sinh chi tiết dựa trên title công việc. SỬ DỤNG 100% TIẾNG VIỆT CHUẨN MỰC, TUYỆT ĐỐI KHÔNG dùng từ tiếng Trung/Nhật.
        - benefits: Quyền lợi chi tiết bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng (Chế độ lương, thưởng lễ tết, BHXH, khám sức khoẻ, teambuilding, môi trường làm việc...). SỬ DỤNG 100% TIẾNG VIỆT CHUẨN MỰC, TUYỆT ĐỐI KHÔNG dùng từ tiếng Trung/Nhật như "挑战", v.v.
        
        Chỉ trả về chuỗi JSON hợp lệ, bắt đầu và kết thúc bằng ngoặc nhọn. Không có markdown formatting backticks (\`\`\`).`;

    let jobData: any = null;
    let success = false;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqResponse = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are an elite HR Recruiter API. You MUST output extremely detailed JD in JSON format. EXTREMELY IMPORTANT: Use perfectly fluent Vietnamese for ALL contents (titles, descriptions, benefits, etc.). NEVER use Chinese, Japanese, or any other foreign language unless it is an industry-standard English IT term.' },
            { role: 'user', content: extractionPrompt }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        const textResponse = groqResponse.data.choices[0].message.content;
        jobData = JSON.parse(textResponse.replace(/```json|```/gi, '').trim());
        success = true;
      } catch (error) {
        this.logger.error(`Groq generateJdFromPrompt failed`);
      }
    }

    // 🥈 Priority 2: Gemini Fallback
    if (!success) {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.aiChatService['genAI'].getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" },
            systemInstruction: 'You are an HR JD Editor. Always reply ONLY in perfectly fluent Vietnamese. Always return strict JSON.'
          });
          const result = await model.generateContent(extractionPrompt);
          jobData = JSON.parse(result.response.text().replace(/```json|```/gi, '').trim());
          success = true;
          break;
        } catch (error) { }
      }
    }

    if (!jobData) {
      throw new Error('Không thể sử dụng dịch vụ AI lúc này, vui lòng thử lại sau.');
    }

    return { success: true, data: jobData };
  }
}
