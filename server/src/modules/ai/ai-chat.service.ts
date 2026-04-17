import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
    if (!this.isConfigured) return 'AI is not configured.';

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

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
    ];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(message);
        const responseText = result.response.text();

        // 2. Lưu vào cache câu hỏi và câu trả lời hoàn chỉnh
        try {
          await this.prisma.aiQueryCache.create({
            data: {
              query: normalizedQuery,
              response: responseText,
            },
          });
        } catch (e) {
          // Bỏ qua lỗi duplicate nếu bị gửi đồng thời
        }

        return responseText;
      } catch (e: any) {
        this.logger.warn(
          `[AiChatService] generateResponse error with ${modelName}. Trying next...`,
        );
        await SLEEP(500);
      }
    }
    this.logger.error('generateResponse error: All models failed.');
    return 'Error generating response';
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
    if (!this.isConfigured) return [];

    // Thử với danh sách model ưu tiên
    const models = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
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
        this.logger.warn(
          `Model ${modelId} lỗi (${error.status || 'unknown'}). Thử model tiếp theo...`,
        );
        await SLEEP(500);
      }
    }

    this.logger.error(
      `Tất cả model expandSearchQuery đều lỗi: ${lastError?.message}`,
    );
    return [];
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
    const isJobPostingIntent = isRecruiter && (
      normalizedMsg.includes('đăng tin') ||
      normalizedMsg.includes('tuyển dụng') ||
      normalizedMsg.includes('cần tuyển') ||
      normalizedMsg.includes('cần tìm') ||
      normalizedMsg.includes('cần gấp') ||
      normalizedMsg.includes('tìm người') ||
      normalizedMsg.includes('tìm nhân viên') ||
      normalizedMsg.includes('tìm ứng viên') ||
      normalizedMsg.includes('tuyển') ||
      normalizedMsg.includes('đăng việc')
    );

    // If message is fairly detailed (over 5 chars), try to extract job data
    if (isJobPostingIntent && message.length > 5) {
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });
        const extractionPrompt = `Bạn là hệ thống trích xuất thông tin tuyển dụng. Hãy phân tích đoạn yêu cầu dưới đây và chuyển thành JSON.
        
        Yêu cầu: "${message}"
        
        Quy tắc:
        - title: Tiêu đề công việc ngắn gọn (nếu không nói rõ, tự đoán dựa trên role).
        - jobType: "FULLTIME", "PARTTIME", hoặc "INTERNSHIP" (mặc định FULLTIME).
        - salaryMin: Lương thấp nhất (số nguyên, e.g. 10000000) (nếu nói 10tr -> 10000000). Trả về 0 nếu không có.
        - salaryMax: Lương cấu nhất (số nguyên, e.g. 20000000). Trả về 0 nếu không có.
        - vacancies: Số lượng tuyển (số nguyên, mặc định 1).
        - experience: Yêu cầu kinh nghiệm bằng chữ (e.g. "1 - 2 năm").
        - minExperienceYears: Số năm tối thiểu dạng số (e.g. 1). Default: 0.
        - hardSkills: Mảng các kỹ năng chuyên môn dạng text (e.g. ["ReactJS", "NodeJS"]).
        - softSkills: Mảng các kỹ năng mềm.
        - autoInviteMatches: Bật tính năng tìm ứng viên tự động mở khoá và nhắn tin. Nếu nội dung có từ khoá "tự động", "mở khoá", "dùng AI", "tìm hộ" thì trả về true, nếu không có thì trả về false. (boolean).
        - description: Mô tả công việc chi tiết rành mạch bằng Markdown (bullet points). Văn phong PHẢI cực kỳ chuyên nghiệp và trang trọng. TUYỆT ĐỐI KHÔNG dùng bất kỳ biểu tượng cảm xúc (emoji) hay sticker nào. Tự sinh (generate) sao cho đầy đủ dựa theo vị trí.
        - requirements: Yêu cầu ứng viên chi tiết bằng Markdown.
        - benefits: Quyền lợi chi tiết bằng Markdown.
        
        Chỉ trả về chuỗi JSON hợp lệ, không có markdown formatting backticks (\`\`\`).`;

        const result = await model.generateContent(extractionPrompt);
        const textResponse = result.response.text();
        const jsonText = textResponse.replace(/```json|```/gi, '').trim();
        const jobData = JSON.parse(jsonText);

        // Notify user context
        yield 'Tuyệt vời! Tôi đã phân tích yêu cầu của bạn, tự động viết sinh động phần mô tả và điền sẵn các thông số vào biểu mẫu đăng tin.';
        
        // Push the action
        yield '__ACTION__:' + JSON.stringify({ type: 'PREFILL_JOB', payload: jobData });
        return;
      } catch (error) {
        this.logger.warn(`Failed to extract job posting intent JSON: ${error}`);
        // Fallthrough to normal chat processing if JSON parsing fails
      }
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

    const models = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
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

        // 1.5. Với RECRUITER: kiểm tra gói dịch vụ để tích hợp upsell
        let recruiterPlanType: string | null = null;
        let upsellContext = '';
        if (isRecruiter && context?.userId) {
          try {
            const recruiterRecord = await this.prisma.recruiter.findUnique({
              where: { userId: context.userId },
              include: { recruiterSubscription: true },
            });
            recruiterPlanType = recruiterRecord?.recruiterSubscription?.planType ?? null;

            // Nếu FREE hoặc không có gói, chuẩn bị context upsell
            if (!recruiterPlanType || recruiterPlanType === 'FREE') {
              upsellContext = `
--- [THÔNG TIN GÓI DỊCH VỤ CỦA NHÀ TUYỂN DỤNG] ---
Nhà tuyển dụng này đang dùng GÓI MIỄN PHÍ (FREE).

CÁC TÍNH NĂNG HẠN CHẾ VỚI GÓI FREE:
- Không dung tính năng tạo tin tự động bằng AI
- Không có AI Cố Vấn JD và tự động sửa JD
- Không có AI Insights & phân tích nhân sự nâng cao
- Giới hạn số lượt đăng tin và mở khóa hồ sơ

CÁC GÓI NÂNG CẤP:
- GÓI LITE: Cho phép tạo JD bằng AI, AI Cố Vấn, tăng quotas. Liên hệ đường dẫn /recruiter/billing/plans
- GÓI GROWTH: Đầy đủ tính năng: AI Insights, tự động sửa JD, không giới hạn. Liên hệ đường dẫn /recruiter/billing/plans

HƯỚNG DẪN CHO AI:
- Khi nhà tuyển dụng hỏi về tính năng nào mà họ chưa có quyền truy cập: hãy giải thích mảnh lệ nhưng chuyên nghiệp rằng tính năng này có trong gói trả phí.
- Ở cuối mỗi phản hồi hữu ích: THÊM vào 1 câu gợi mở khóa tiềm năng của gói trả. Ví dụ: "Nếu muốn AI tự động viết JD chuẩn cho bạn, hãy thử Gói LITE trên Workly."
- Không spam, chỉ gợi ý 1 lần mỗi phản hồi và luôn giữ văn phong chuyên nghiệp.
---`;
            }
          } catch (e) {
            this.logger.warn(`[AiChatService] Could not fetch recruiter plan: ${e}`);
          }
        }

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

        NGUYÊN TẮC:
        1. Từ chối NGAY nếu câu hỏi lạc chủ đề tuyển dụng. Nói: "Tôi chỉ hỗ trợ các vấn đề tuyển dụng."
        2. Ngắn gọn, súc tích, trình bày bằng bullet points dễ đọc, tối đa 150 từ.
        3. Không giả vờ mình là ứng viên.

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

        NGUYÊN TẮC VÀNG:
        1. **Bỏ Filler**: Không dùng "Dựa trên hồ sơ của bạn". Nói thẳng như cố vấn thiết thực.
        2. Trình bày sạch sẽ, phân đoạn rõ ràng bằng Markdown (bullet points, in đậm từ khóa).
        3. Tuyệt đối không xưng "tôi" khi không cần thiết, tập trung vào giải phẫu kỹ năng ứng viên.
        4. **Guardrails**: Từ chối câu hỏi ngoài lề (Toán, Thời tiết, Chính trị) bằng 1 câu.

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
        if (isRecruiter && (!recruiterPlanType || recruiterPlanType === 'FREE')) {
          yield '__ACTION__:' + JSON.stringify({
            type: 'SHOW_UPGRADE_CTA',
            payload: {
              title: 'Ờ khóa tiềm năng tuyển dụng của bạn',
              subtitle: 'Nâng cấp để dùng AI tạo JD, phân tích hồ sơ và nhiều hơn nữa.',
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

