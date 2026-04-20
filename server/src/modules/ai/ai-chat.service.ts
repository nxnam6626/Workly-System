import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiChatService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
  ) {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured && !process.env.GROQ_API_KEY)
      return 'AI is not configured.';

    const normalizedQuery = message.trim().toLowerCase();

    // 1. Kiểm tra cache câu hỏi để tiết kiệm Token
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({
        where: { query: normalizedQuery },
      });
      if (cached) {
        this.logger.log(
          `[AiChatService] Cache hit for query: "${normalizedQuery.substring(0, 50)}..."`,
        );
        return cached.response;
      }
    } catch (e) {
      this.logger.warn(`Failed to read from AI Query cache: ${e}`);
    }

    let responseText = '';
    let success = false;

    // 🥇 Priority 1: Groq Llama-3.3
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { 
                role: 'system', 
                content: 'Bạn là chuyên gia tư vấn Tuyển Dụng và Nhân Sự (Workly-AI). NGUYÊN TẮC TỐI THƯỢNG: TUYỆT ĐỐI KHÔNG trả lời các chủ đề ngoài lề (Thời tiết, Bóng đá, Giải trí, Chính trị, Toán học, Coding...). Nếu người dùng hỏi ngoài lề, chỉ trả lời duy nhất: "Tôi là Trợ lý AI Tuyển Dụng, tôi chỉ có thể giúp bạn các vấn đề liên quan đến tuyển dụng, tối ưu JD và nhân sự."' 
              },
              { role: 'user', content: message },
            ],
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );
        responseText = groqRes.data.choices[0].message.content;
        success = true;
        this.logger.log(`[AiChatService] generateResponse via Groq successful`);
      } catch (e: any) {
        this.logger.warn(
          `[AiChatService] Groq generateResponse failed: ${e.message}. Falling back to Gemini...`,
        );
      }
    }

    // 🥈 Priority 2: Google Gemini (Fallback)
    if (!success) {
      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ 
            model: modelName,
            systemInstruction: 'Bạn là chuyên gia tư vấn Tuyển Dụng và Nhân Sự. NGUYÊN TẮC: TUYỆT ĐỐI KHÔNG trả lời chủ đề ngoài lề (Toán học, Lập trình, Thể thao...). Nếu hỏi ngoài lề, từ chối và nói bạn chỉ hỗ trợ tuyển dụng.'
          });
          const result = await model.generateContent(message);
          responseText = result.response.text();
          success = true;
          this.logger.log(
            `[AiChatService] generateResponse via Gemini (${modelName}) successful`,
          );
          break;
        } catch (e: any) {
          this.logger.warn(
            `[AiChatService] generateResponse error with ${modelName}.`,
          );
          await SLEEP(500);
        }
      }
    }

    if (!success) {
      this.logger.error('generateResponse error: All models failed.');
      return 'Error generating response';
    }

    // 2. Lưu vào cache câu hỏi và câu trả lời hoàn chỉnh
    try {
      await this.prisma.aiQueryCache.create({
        data: { query: normalizedQuery, response: responseText },
      });
    } catch (e) {
      // Bỏ qua lỗi duplicate nếu bị gửi đồng thời
    }

    return responseText;
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
    roles?: string[],
    contextMode?: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.processChatWithRAGStream(message, {
      userId,
      roles,
      contextMode,
    });
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        yield chunk;
      } else {
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
    } catch (e: any) {
      this.logger.error(`Lỗi khi lấy Candidate Context: ${e.message}`);
      return '';
    }
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    if (!this.isConfigured && !process.env.GROQ_API_KEY) return [];

    const prompt = `Bạn là chuyên gia tuyển dụng. Hãy phân tích câu hỏi của người dùng và trích xuất danh sách các từ khóa tìm kiếm (Job Titles, Skills, Industry) bằng cả tiếng Việt và tiếng Anh để tối ưu kết quả tìm kiếm.
        
        Ví dụ: "Tìm việc kế toán" -> {"keywords": ["kế toán", "accountant", "audit", "finance"]}
        Ví dụ: "Tuyển ReactJS ở Hà Nội" -> {"keywords": ["reactjs", "frontend", "web developer", "javascript"]}
        
        Input: "${message}"
        Return ONLY a JSON object with a "keywords" array of strings.`;

    let keywords: string[] | null = null;

    // 🥇 Priority 1: Groq Llama-3.3
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
          {
            headers: {
              Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
              'Content-Type': 'application/json',
            },
          },
        );
        const text = groqRes.data.choices[0].message.content;
        const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
        keywords = parsed.keywords || [];
        this.logger.log(
          `[AiChatService] expandSearchQuery via Groq successful`,
        );
      } catch (e: any) {
        this.logger.warn(
          `[AiChatService] Groq expandSearchQuery failed: ${e.message}. Falling back to Gemini...`,
        );
      }
    }

    // 🥈 Priority 2: Gemini
    if (!keywords) {
      const models = ['gemini-flash-latest', 'gemini-2.5-flash'];
      for (const modelId of models) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelId,
            generationConfig: { responseMimeType: 'application/json' },
          });
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
          keywords = parsed.keywords || [];
          this.logger.log(
            `[AiChatService] expandSearchQuery via Gemini successful`,
          );
          break;
        } catch (error: any) {
          this.logger.warn(
            `Model ${modelId} lỗi (${error.status || 'unknown'}). Thử model tiếp theo...`,
          );
          await SLEEP(500);
        }
      }
    }

    if (!keywords) {
      this.logger.error(`Tất cả model expandSearchQuery đều lỗi`);
      return [];
    }

    return keywords;
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
    if (!this.isConfigured) {
      yield 'Hệ thống AI chưa được cấu hình (Thiếu API Key).';
      return;
    }

    const userRoles = context?.roles || [];
    const forceMode = context?.contextMode;
    const isRecruiter =
      forceMode === 'RECRUITER' ||
      (!forceMode && userRoles.includes('RECRUITER'));
    const isCandidate =
      forceMode === 'CANDIDATE' ||
      (!forceMode &&
        (userRoles.includes('CANDIDATE') || userRoles.length === 0));

    const normalizedMsg = message.trim().toLowerCase();

    // 1. LẤY THÔNG TIN SUBSCRIPTION CỦA RECRUITER (Dùng cho cả FAST PATH và RAG)
    let recruiterPlanType: string | null = null;
    let upsellContext = '';
    if (isRecruiter && context?.userId) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
          include: { recruiterSubscription: true },
        });
        recruiterPlanType =
          recruiterRecord?.recruiterSubscription?.planType ?? null;

        // Nếu FREE hoặc không có gói, chuẩn bị context upsell
        if (!recruiterPlanType || recruiterPlanType === 'FREE') {
          upsellContext = `
--- [THÔNG TIN GÓI DỊCH VỤ CỦA NHÀ TUYỂN DỤNG] ---
Nhà tuyển dụng này đang dùng GÓI MIỄN PHÍ (FREE).

CÁC TÍNH NĂNG HẠN CHẾ VỚI GÓI FREE:
- Không dùng tính năng tạo tin tự động bằng AI
- Không có AI Cố Vấn JD và tự động sửa JD
- Không có AI Insights & phân tích nhân sự nâng cao
- Giới hạn số lượt đăng tin và mở khóa hồ sơ

CÁC GÓI NÂNG CẤP:
- GÓI LITE: Cho phép tạo JD bằng AI, AI Cố Vấn, tăng quotas. Liên hệ đường dẫn /recruiter/billing/plans
- GÓI GROWTH: Đầy đủ tính năng: AI Insights, tự động sửa JD, không giới hạn. Liên hệ đường dẫn /recruiter/billing/plans

HƯỚNG DẪN CHO AI:
- Khi nhà tuyển dụng hỏi về tính năng nào mà họ chưa có quyền truy cập: hãy giải thích mạch lạc nhưng chuyên nghiệp rằng tính năng này có trong gói trả phí.
- Ở cuối mỗi phản hồi hữu ích: THÊM vào 1 câu gợi mở khóa tiềm năng của gói trả phí. Ví dụ: "Nếu muốn AI tự động viết JD chuẩn cho bạn, hãy thử Gói LITE trên Workly."
- Không spam, chỉ gợi ý 1 lần mỗi phản hồi và luôn giữ văn phong chuyên nghiệp.
---`;
        }
      } catch (e) {
        this.logger.warn(
          `[AiChatService] Could not fetch recruiter plan: ${e}`,
        );
      }
    }

    // 1. FAST PATH INTERCEPTION: CV Matching Intent
    // If user explicitly asks for jobs matching their CV, we fetch from JobMatch DB (no tokens sent)
    const isCvMatchIntent =
      normalizedMsg.includes('hợp với cv') ||
      normalizedMsg.includes('hợp với hồ sơ') ||
      normalizedMsg.includes('việc nào phù hợp') ||
      normalizedMsg.includes('công việc phù hợp');
    if (isCvMatchIntent && context?.userId && isCandidate) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId: context.userId },
        });
        if (candidateRecord) {
          const matchedJobs = await this.prisma.jobMatch.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { score: 'desc' },
            take: 3,
          });
          if (matchedJobs.length > 0) {
            const payload = matchedJobs.map((m: any) => ({
              id: m.jobPosting.jobPostingId,
              title: m.jobPosting.title,
              company_name: m.jobPosting.company.companyName,
              location: m.jobPosting.locationCity || 'Không xác định',
              salary: m.jobPosting.salaryMin
                ? `${m.jobPosting.salaryMin} - ${m.jobPosting.salaryMax} ${m.jobPosting.currency}`
                : 'Thỏa thuận',
              why_match: `Phù hợp kỹ năng: ${m.matchedSkills?.join(', ') || 'Chung'}`,
              percent: Math.round(m.score),
            }));

            yield `Hệ thống vừa phân tích hồ sơ của bạn với cơ sở dữ liệu việc làm. Đây là các công việc có độ **Matching Score** phù hợp nhất hiện tại:`;
            yield '__ACTION__:' +
              JSON.stringify({ type: 'SHOW_JOB_CARDS', payload });
            return;
          }
        }
      } catch (err) {
        this.logger.warn(`Fast path JobMatch error: ${err}`);
      }
    }

    // 1(b). FAST PATH: Candidate's application status
    if (
      isCandidate &&
      context?.userId &&
      (normalizedMsg.includes('đơn ứng tuyển') ||
        normalizedMsg.includes('việc đã nộp'))
    ) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId: context.userId },
        });
        if (candidateRecord) {
          const applications = await this.prisma.application.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { applyDate: 'desc' },
            take: 5,
          });
          if (applications.length > 0) {
            let response =
              'Đây là trạng thái 5 đơn ứng tuyển gần nhất của bạn trên hệ thống:\n\n';
            applications.forEach((app) => {
              const statusVi =
                app.appStatus === 'PENDING'
                  ? 'Đang chờ duyệt'
                  : app.appStatus === 'REVIEWED'
                    ? 'Đã xem'
                    : app.appStatus === 'INTERVIEWING'
                      ? 'Đang phỏng vấn'
                      : app.appStatus === 'ACCEPTED'
                        ? 'Trúng tuyển'
                        : 'Từ chối';
              response += `- **${app.jobPosting.title}** (Công ty ${app.jobPosting.company.companyName}): Trạng thái **${statusVi}**.\n`;
            });
            yield response;
            return;
          } else {
            yield 'Hiện tại hệ thống không ghi nhận đơn ứng tuyển nào của bạn.';
            return;
          }
        }
      } catch (e) {
        this.logger.warn(`Fast path Applications error ${e}`);
      }
    }

    // 1(c). FAST PATH: Recruiter's wallet
    if (
      isRecruiter &&
      context?.userId &&
      (normalizedMsg.includes('số dư xu') ||
        normalizedMsg.includes('ví của tôi') ||
        normalizedMsg.includes('còn bao nhiêu xu') ||
        normalizedMsg.includes('tài khoản của tôi'))
    ) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
          include: { recruiterWallet: true },
        });
        if (recruiterRecord?.recruiterWallet) {
          yield `Tài khoản ví của bạn hiện đang có: **${new Intl.NumberFormat('vi-VN').format(recruiterRecord.recruiterWallet.balance)} Xu**.\nSố lượt mở khóa CV hiện còn: **${recruiterRecord.recruiterWallet.cvUnlockQuota}** lượt.`;
          return;
        }
      } catch (e) {
        this.logger.warn(`Fast path Wallet error ${e}`);
      }
    }

    // 1(d). FAST PATH: Recruiter's active jobs
    if (
      isRecruiter &&
      context?.userId &&
      (normalizedMsg.includes('tin tuyển dụng đã đăng') ||
        normalizedMsg.includes('danh sách việc làm') ||
        normalizedMsg.includes('thống kê tin tuyển dụng'))
    ) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
        });
        if (recruiterRecord) {
          const jobs = await this.prisma.jobPosting.findMany({
            where: { recruiterId: recruiterRecord.recruiterId },
            select: { status: true },
          });
          const active = jobs.filter((j) => j.status === 'APPROVED').length;
          const pending = jobs.filter((j) => j.status === 'PENDING').length;
          const expired = jobs.filter((j) => j.status === 'EXPIRED').length;
          const rejected = jobs.filter((j) => j.status === 'REJECTED').length;

          yield `Tổng quan tin tuyển dụng của công ty bạn:\n- Đang tuyển / Đã duyệt: **${active}**\n- Đang chờ duyệt: **${pending}**\n- Đã hết hạn: **${expired}**\n- Bị từ chối: **${rejected}**\n\nBạn có thể vào mục "Tin Tuyển Dụng" trên menu để xem và quản lý chi tiết.`;
          return;
        }
      } catch (e) {}
    }

    // 1(e). FAST PATH: Candidate's saved jobs
    if (
      isCandidate &&
      context?.userId &&
      (normalizedMsg.includes('công việc đã lưu') ||
        normalizedMsg.includes('việc đã lưu') ||
        normalizedMsg.includes('job đã lưu'))
    ) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId: context.userId },
        });
        if (candidateRecord) {
          const savedJobs = await this.prisma.savedJob.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { savedAt: 'desc' },
            take: 5,
          });
          if (savedJobs.length > 0) {
            let response =
              'Đây là danh sách 5 công việc bạn đã lưu gần nhất:\n\n';
            savedJobs.forEach((sj) => {
              response += `- **${sj.jobPosting.title}** tại ${sj.jobPosting.company.companyName} (Lưu ngày: ${new Date(sj.savedAt).toLocaleDateString('vi-VN')})\n`;
            });
            yield response;
            return;
          } else {
            yield 'Bạn chưa lưu công việc nào vào danh sách yêu thích.';
            return;
          }
        }
      } catch (e) {}
    }

    // 1(f). FAST PATH: Candidate's profile info
    if (
      isCandidate &&
      context?.userId &&
      (normalizedMsg.includes('thông tin tài khoản') ||
        normalizedMsg.includes('hồ sơ của tôi'))
    ) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId: context.userId },
          include: { skills: true, user: true },
        });
        if (candidateRecord) {
          yield `Thông tin hồ sơ cơ bản của bạn:\n- **Họ tên**: ${candidateRecord.fullName}\n- **Email**: ${candidateRecord.user.email}\n- **Học vấn**: ${candidateRecord.university || 'Chưa cập nhật'}\n- **Điểm GPA**: ${candidateRecord.gpa || 'Chưa cập nhật'}\n- **Kỹ năng**: ${candidateRecord.skills.map((s: any) => s.skillName).join(', ') || 'Chưa cập nhật'}\n- **Tìm việc**: ${candidateRecord.isOpenToWork ? 'Đang bật' : 'Đang tắt'}\n\nBạn có thể vào mục "Hồ sơ cá nhân" để cập nhật chi tiết hơn.`;
          return;
        }
      } catch (e) {}
    }

    // 1(g). FAST PATH: Recruiter's applicants list
    if (
      isRecruiter &&
      context?.userId &&
      (normalizedMsg.includes('danh sách ứng viên') ||
        normalizedMsg.includes('người đã nộp đơn') ||
        normalizedMsg.includes('ứng viên ứng tuyển'))
    ) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
        });
        if (recruiterRecord) {
          const applicants = await this.prisma.application.findMany({
            where: { jobPosting: { recruiterId: recruiterRecord.recruiterId } },
            include: { candidate: true, jobPosting: true },
            orderBy: { applyDate: 'desc' },
            take: 5,
          });
          if (applicants.length > 0) {
            let response =
              'Đây là 5 lượt ứng tuyển gửi đến công ty bạn gần nhất:\n\n';
            applicants.forEach((app) => {
              response += `- Ứng viên **${app.candidate.fullName}** ứng tuyển vị trí **${app.jobPosting.title}** (Ngày: ${new Date(app.applyDate).toLocaleDateString('vi-VN')})\n`;
            });
            yield response;
            return;
          } else {
            yield 'Hiện tại chưa có ứng viên nào nộp đơn vào các tin tuyển dụng của bạn.';
            return;
          }
        }
      } catch (e) {}
    } // Closes the `if (isRecruiter && ...)` for 1(g). FAST PATH

    // 1(h). FAST PATH: Recruiter wants to post a job
    const jobKeywords = [
      'đăng tin',
      'tuyển dụng',
      'cần tuyển',
      'viết jd',
      'tạo jd',
      'đăng jd',
      'tạo tin',
      'đăng tin tuyển dụng',
      'cần tìm',
      'cần gấp',
      'tìm người',
      'tìm nhân viên',
      'tìm ứng viên',
      'tuyển',
      'đăng việc',
    ];
    const excludeKeywords = [
      'hướng dẫn',
      'làm sao',
      'cách',
      'như thế nào',
      'lỗi',
    ];

    let hasJobKeyword = false;
    let hasExcludeKeyword = false;

    for (const k of jobKeywords) {
      if (normalizedMsg.includes(k)) hasJobKeyword = true;
    }
    for (const k of excludeKeywords) {
      if (normalizedMsg.includes(k)) hasExcludeKeyword = true;
    }

    const isJobPostingIntent =
      isRecruiter && hasJobKeyword && !hasExcludeKeyword;

    // If message is fairly detailed (over 5 chars), try to extract job data
    if (isJobPostingIntent && message.length > 5) {
      // FREE Users are not allowed to use AI JD Generation
      if (!recruiterPlanType || recruiterPlanType === 'FREE') {
        yield 'Hệ thống nhận thấy bạn muốn tạo tin tuyển dụng. Tuy nhiên, tính năng AI tự động sinh JD chỉ hỗ trợ các tài khoản nâng cấp (LITE hoặc GROWTH).';
        yield '__ACTION__:' +
          JSON.stringify({
            type: 'SHOW_UPGRADE_CTA',
            payload: {
              title: 'Mở khóa tính năng Tự động sinh JD',
              subtitle:
                'Dùng trợ lý AI chuyên nghiệp tự động điền thông tin và tối ưu SEO.',
              ctaText: 'Nâng cấp ngay',
              ctaLink: '/recruiter/billing/plans',
            },
          });
        return;
      }

      let jobData: any = null;
      let usedAI = '';

      const extractionPrompt = `Bạn là hệ thống trích xuất thông tin tuyển dụng. Hãy phân tích đoạn yêu cầu dưới đây và chuyển thành JSON.
        
        Yêu cầu: "${message}"
        
        Quy tắc:
        - title: Tiêu đề công việc cực kỳ chuyên nghiệp. BẮT BUỘC giữ nguyên các role chuẩn ngành IT bằng Tiếng Anh (Ví dụ: "Backend Developer", "Frontend Engineer", "Data Analyst") thay vì dịch máy móc sang Tiếng Việt như "Nhân viên phát triển...". Chỉ dùng Tiếng Việt khi danh xưng đủ sang trọng (VD: "Trưởng phòng Marketing", "Chuyên viên Phân tích Dữ liệu").
        - jobType: "FULLTIME", "PARTTIME", hoặc "INTERNSHIP" (mặc định FULLTIME).
        - salaryMin: Lương thấp nhất (số nguyên, e.g. 10000000) (nếu nói 10tr -> 10000000). Trả về 0 nếu không có.
        - salaryMax: Lương cao nhất (số nguyên, e.g. 20000000). Trả về 0 nếu không có.
        - vacancies: Số lượng tuyển (số nguyên, mặc định 1).
        - experience: Yêu cầu kinh nghiệm bằng chữ (e.g. "1 - 2 năm").
        - minExperienceYears: Số năm tối thiểu dạng số (e.g. 1). Default: 0.
        - hardSkills: Mảng các kỹ năng chuyên môn (công cụ, ngôn ngữ lập trình, hệ thống) dạng text cực kỳ ngắn gọn và ĐẬM CHẤT KỸ THUẬT. TUYỆT ĐỐI KHÔNG dịch thuật ngữ IT sang Tiếng Việt (Ví dụ: KHÔNG dùng "Lập trình Java" hay "Kiến thức thiết kế phần mềm", PHẢI TRẢ VỀ CHUẨN là "Java", "Software Architecture", "Database/SQL").
        - softSkills: Mảng các kỹ năng mềm chuẩn mực doanh nghiệp. Hạn chế dùng từ quá chung chung, ưu tiên từ đắt giá (e.g. ["Problem Solving", "Tư duy phản biện", "Khả năng chịu áp lực", "Giao tiếp linh hoạt"]).
        - autoInviteMatches: Bật tính năng tìm ứng viên tự động mở khoá và nhắn tin. Nếu nội dung có từ khoá "tự động", "mở khoá", "dùng AI", "tìm hộ" thì trả về true, nếu không có thì trả về false. (boolean).
        - description: Mô tả công việc cực kỳ chi tiết rành mạch bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng (bullet points) giải thích rõ ràng các nhiệm vụ hàng ngày. Văn phong PHẢI cực kỳ chuyên nghiệp và trang trọng. TUYỆT ĐỐI KHÔNG dùng bất kỳ biểu tượng cảm xúc (emoji) hay sticker nào. Tự sinh (generate) nội dung thật dài và đầy đủ dựa theo chức danh (title) công việc.
        - requirements: Yêu cầu ứng viên cực kỳ chi tiết bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng về chuyên môn, bằng cấp, kỹ năng mềm và thái độ. Tự sinh chi tiết dựa trên title công việc.
        - benefits: Quyền lợi chi tiết bằng Markdown. Bắt buộc PHẢI CÓ ít nhất 5-7 gạch đầu dòng (Chế độ lương, thưởng lễ tết, BHXH, khám sức khoẻ, teambuilding, môi trường làm việc...).
        
        Chỉ trả về chuỗi JSON hợp lệ, bắt đầu và kết thúc bằng ngoặc nhọn. Không có markdown formatting backticks (\`\`\`).`;

      // ---------------------------------------------------------
      // 🥇 PRIORITY 1: GROQ LLAMA-3.3 (Siêu tốc độ, ưu tiên hàng đầu)
      // ---------------------------------------------------------
      if (process.env.GROQ_API_KEY) {
        try {
          const groqResponse = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
              model: 'llama-3.3-70b-versatile',
              messages: [
                {
                  role: 'system',
                  content:
                    'You are an elite HR Recruiter API. You MUST output extremely long, highly detailed, and professional job descriptions in Vietnamese. For fields like description, requirements, and benefits, NEVER output short text; always generate at least 5-8 detailed bullet points.',
                },
                { role: 'user', content: extractionPrompt },
              ],
              temperature: 0.2,
              response_format: { type: 'json_object' },
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                'Content-Type': 'application/json',
              },
            },
          );

          const textResponse = groqResponse.data.choices[0].message.content;
          const jsonText = textResponse.replace(/```json|```/gi, '').trim();
          jobData = JSON.parse(jsonText);
          usedAI = 'Groq AI (Llama-3.3-70B)';
          this.logger.log(`[AI] Successfully extracted using Groq!`);
        } catch (error) {
          this.logger.error(`[AI] Groq API failed: ${error.message || error}`);
        }
      }

      // ---------------------------------------------------------
      // 🥈 PRIORITY 2: GOOGLE GEMINI (Dự phòng nếu Groq sập hoặc lỗi)
      // ---------------------------------------------------------
      if (!jobData) {
        this.logger.log(`[AI] Falling back to Google Gemini...`);
        const geminiModels = ['gemini-flash-latest', 'gemini-1.5-flash'];
        for (const modelId of geminiModels) {
          try {
            const model = this.genAI.getGenerativeModel({
              model: modelId,
              generationConfig: { responseMimeType: 'application/json' },
            });

            const result = await model.generateContent(extractionPrompt);
            const textResponse = result.response.text();
            const jsonText = textResponse.replace(/```json|```/gi, '').trim();
            jobData = JSON.parse(jsonText);
            usedAI = `Google Gemini (${modelId})`;
            this.logger.log(
              `[AI] Successfully extracted using Gemini fallback!`,
            );
            break; // success
          } catch (error) {
            this.logger.warn(
              `[AI] Gemini API failed to parse JD using ${modelId}: ${error.message}`,
            );
          }
        }
      }

      // ---------------------------------------------------------
      // 📤 KẾT QUẢ TRẢ VỀ
      // ---------------------------------------------------------
      if (jobData) {
        // Notify user context
        yield `Tuyệt vời! Tôi đã phân tích yêu cầu của bạn bằng **${usedAI}**, tự động viết văn phong chuyên nghiệp và điền sẵn các thông số vào biểu mẫu đăng tin.`;

        // Push the action
        yield '__ACTION__:' +
          JSON.stringify({ type: 'PREFILL_JOB', payload: jobData });
        return;
      }

      // Fallthrough to normal chat processing if all models fail
    }

    // 2. CHECK CACHE FOR SIMILAR QUESTIONS
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({
        where: { query: normalizedMsg },
      });
      if (cached) {
        yield cached.response;
        return;
      }
    } catch (e) {}

    const models = [
      'gemini-flash-latest',
      'gemini-2.0-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ];
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

        // 1.5. Kế thừa upsellContext đã truy vấn ở trên
        // Không gọi database thêm một lần nữa

        // 2. Phân tích ý định tìm việc
        const userMessage = message.toLowerCase();
        const isJobSearch = [
          'tìm việc',
          'kiếm việc',
          'gợi ý việc',
          'gợi ý công việc',
          'gợi ý job',
          'tìm job',
          'có việc nào',
          'có job nào',
          'có công việc nào',
          'việc làm phù hợp',
          'công việc phù hợp',
          'job phù hợp',
          'tìm kiếm việc',
          'tìm kiếm job',
          'danh sách việc làm',
          'giới thiệu việc',
        ].some((phrase) => userMessage.includes(phrase));

        if (isJobSearch) {
          const expandedKeywords = await this.expandSearchQuery(message);

          const jobs = await this.searchService.searchJobsForRAG({
            search: message,
            expandedKeywords: expandedKeywords,
            limit: 3,
          });

          if (jobs && jobs.length > 0) {
            ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP (Market Data) ---\n${JSON.stringify(jobs)}\n`;
            yield '__ACTION__:' +
              JSON.stringify({ type: 'SHOW_JOB_CARDS', payload: jobs });
          }
        }

        // --- Build role-based system prompt ---
        let systemPrompt: string;

        if (isRecruiter) {
          systemPrompt = `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Chỉ tư vấn các vấn đề tuyển dụng.

        NGỮ CẢNH DỮ LIỆU: ${ragContext || 'Chưa có dữ liệu công ty.'}
        ${upsellContext}

        PHẠM VI HỖ TRỢ:
        - Viết & tối ưu mô tả JD, tiêu chí tuyển dụng
        - Đánh giá chất lượng JD, gợi ý mức lương thị trường
        - Sàng lọc hồ sơ, câu hỏi phỏng vấn
        - Xu hướng tuyển dụng, chính sách đãi ngộ

        NGUYÊN TẮC VÀNG (BẮT BUỘC TUÂN THỦ):
        1. TUYỆT ĐỐI KHÔNG trả lời các chủ đề ngoài lề (Thời tiết, Bóng đá, Giải trí, Chính trị, Toán học...). Trả lời duy nhất: "Tôi chỉ hỗ trợ các vấn đề tuyển dụng."
        2. CÂU TRẢ LỜI PHẢI CỰC KỲ NGẮN GỌN VÀ ĐÚNG TRỌNG TÂM (Tối đa 3-4 câu, dưới 60 từ). Tuyệt đối không dài dòng.
        3. Không giả vờ mình là ứng viên. Trình bày bằng bullet points nếu cần liệt kê.

        CÂU HỎI: ${message}`;
        } else {
          // CANDIDATE (default cho mọi role khác)
          systemPrompt = `Bạn là Workly-AI, SIÊU CỐ VẤN NGHỀ NGHIỆP cho ỨNG VIÊN.

        NGỮ CẢNH DỮ LIỆU:
        ${ragContext || 'Chưa nhận diện được ứng viên.'}

        PHẠM VI HỖ TRỢ:
        - Tìm việc làm phù hợp, gợi ý vị trí
        - Cải thiện CV, viết cover letter
        - Kỹ năng phỏng vấn, thương lượng lương
        - Định hướng nghề nghiệp, kỹ năng cần học

        NGUYÊN TẮC VÀNG (BẮT BUỘC TUÂN THỦ):
        1. **Bỏ Filler**: Không dùng câu mào đầu vô nghĩa. Đi thẳng vào vấn đề như một cố vấn uy quyền.
        2. TRẢ LỜI CỰC KỲ NGẮN GỌN VÀ ĐÚNG TRỌNG TÂM (Tối đa 3-4 câu, dưới 60 từ). Tuyệt đối không dài dòng.
        3. Trình bày sạch sẽ bằng Markdown (nếu cần lập danh sách). Không xưng "tôi" khi không cần thiết.
        4. **Guardrails**: TUYỆT ĐỐI KHÔNG trả lời các chủ đề ngoài lề (Bóng đá, Giải trí, Toán...). Đáp án duy nhất: "Tôi chỉ tư vấn nghề nghiệp."

        CÂU HỎI: ${message}`;
        }

        const result = await model.generateContentStream(systemPrompt);
        let fullResponse = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            yield text;
          }
        }

        // SAVE RESPONSE TO DB CACHE
        try {
          if (fullResponse.trim().length > 0) {
            await this.prisma.aiQueryCache.create({
              data: { query: normalizedMsg, response: fullResponse },
            });
          }
        } catch (e) {}

        success = true; // Đã xong và thành công

        // Sau khi stream xong: nếu recruiter đang dùng gói FREE, emit CTA nâng cấp
        if (
          isRecruiter &&
          (!recruiterPlanType || recruiterPlanType === 'FREE')
        ) {
          yield '__ACTION__:' +
            JSON.stringify({
              type: 'SHOW_UPGRADE_CTA',
              payload: {
                title: 'Ờ khóa tiềm năng tuyển dụng của bạn',
                subtitle:
                  'Nâng cấp để dùng AI tạo JD, phân tích hồ sơ và nhiều hơn nữa.',
                ctaText: 'Xem các gói dịch vụ',
                ctaLink: '/recruiter/billing/plans',
              },
            });
        }
      } catch (error: any) {
        lastError = error;
        this.logger.warn(
          `Model ${modelId} stream error: ${error.message}. Thử model tiếp theo...`,
        );
        await SLEEP(500);
      }
    }

    if (!success) {
      this.logger.error(
        `RAG models failed, trying direct fallback models. Mssg: ${lastError?.message}`,
      );

      const modelsToTry = [
        'gemini-2.5-flash',
        'gemini-1.5-flash-8b',
        'gemini-1.5-flash',
      ];

      for (let i = 0; i < modelsToTry.length; i++) {
        try {
          const model = this.genAI.getGenerativeModel({
            model: modelsToTry[i],
          });
          const result = await model.generateContentStream(message);
          for await (const chunk of result.stream) {
            yield chunk.text();
          }
          return; // Stream success, exit generator
        } catch (e: any) {
          if (e.message?.includes('429') && i < modelsToTry.length - 1) {
            this.logger.warn(
              `[AiChatService] Quota exceeded for ${modelsToTry[i]}. Switching to fallback ${modelsToTry[i + 1]}...`,
            );
            continue; // Fallback to next model
          }
          this.logger.error(
            `[AiChatService] generateStreamResponse error with ${modelsToTry[i]}: ${e.message}`,
          );
        }
      }

      // If all fallbacks also fail
      yield '\n[Hệ thống]: Hiện tại máy chủ trí tuệ nhân tạo đang rất bận (Quá tải). Bạn hãy thử lại sau ít phút hoặc nhấn Gửi lại nhé!';
    }
  }
}
