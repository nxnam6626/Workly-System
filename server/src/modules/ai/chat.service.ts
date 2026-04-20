import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SearchService } from '../search/search.service';
import { RedisService } from '../../redis/redis.service';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ChatService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly redisService: RedisService,
  ) {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    } else {
      console.warn('GEMINI_API_KEY is not configured for ChatService.');
    }
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
    roles?: string[],
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.processChatWithRAGStream(message, { userId, roles });
    for await (const chunk of stream) {
      if (typeof chunk === 'string') {
        yield chunk;
      } else {
        yield `__ACTION__:${JSON.stringify(chunk)}`;
      }
    }
  }

  /**
   * Bước 1: Trích xuất ý định (NL2API) sử dụng model nhanh.
   * Dịch từ ngôn ngữ tự nhiên ra dạng JSON intent.
   */
  async extractIntent(message: string): Promise<{ intent: string, filters: any }> {
    if (!this.isConfigured) return { intent: 'general', filters: {} };
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
      const prompt = `Bạn là hệ thống trích xuất ý định tìm việc và tuyển dụng. 
Câu nói người dùng: "${message}"

Nhiệm vụ: Trả về JSON thuần tuý (không markdown).
Nếu người dùng (ứng viên) đang nhắc đến tìm việc, xin gợi ý việc làm, hãy đặt intent = "job_search" và trích xuất các filters (keyword, location, min_salary dạng số).
Nếu người dùng (Nhà tuyển dụng) muốn đăng tin tuyển dụng hoặc tạo việc làm, hãy đặt intent = "create_job" và trích xuất các filters (title, vacancies dạng số, min_salary dạng số, max_salary dạng số).
Nếu không phải 2 ý định trên, đặt intent = "general".

Ví dụ 1: "Có việc frontend nào ở HCM lương trên 15 triệu không?"
Trả về: 
{
  "intent": "job_search",
  "filters": {
    "keyword": "frontend",
    "location": "Hồ Chí Minh",
    "min_salary": 15000000
  }
}

Ví dụ 2: "tuyển 10 thực tập 9tr đến 15 triệu"
Trả về:
{
  "intent": "create_job",
  "filters": {
    "title": "Thực tập",
    "vacancies": 10,
    "min_salary": 9000000,
    "max_salary": 15000000
  }
}`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
      return JSON.parse(text);
    } catch (e) {
      this.logger.error(`Extract Intent Error: ${e.message}`);
      return { intent: 'general', filters: {} };
    }
  }

  /**
   * Hàm lấy context Candiates tái sử dụng
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

  async *processChatWithRAGStream(
    message: string,
    context?: { cvText?: string; userId?: string; roles?: string[] },
  ): AsyncGenerator<any, void, unknown> {
    if (!this.isConfigured) {
      yield 'Hệ thống AI chưa được cấu hình (Thiếu API Key).';
      return;
    }

    const userRoles = context?.roles || [];
    const isRecruiter = userRoles.includes('RECRUITER');
    const isCandidate = !isRecruiter && (userRoles.includes('CANDIDATE') || userRoles.length === 0);

    const normalizedMsg = message.trim().toLowerCase();

    // ====================================================================
    // FAST PATHS - GIỮ NGUYÊN ĐỂ KHÔNG MẤT TÍNH NĂNG CÒN LẠI
    // ====================================================================

    // 1(a). FAST PATH: CV Matching Intent
    const isCvMatchIntent = normalizedMsg.includes('hợp với cv') || normalizedMsg.includes('hợp với hồ sơ') || normalizedMsg.includes('việc nào phù hợp') || normalizedMsg.includes('công việc phù hợp');
    if (isCvMatchIntent && context?.userId && isCandidate) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId: context.userId } });
        if (candidateRecord) {
          const matchedJobs = await this.prisma.jobMatch.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { score: 'desc' },
            take: 3
          });
          if (matchedJobs.length > 0) {
            const payload = matchedJobs.map((m: any) => ({
              id: m.jobPosting.jobPostingId,
              title: m.jobPosting.title,
              company_name: m.jobPosting.company.companyName,
              location: m.jobPosting.locationCity || 'Không xác định',
              salary: m.jobPosting.salaryMin ? `${m.jobPosting.salaryMin} - ${m.jobPosting.salaryMax} ${m.jobPosting.currency}` : 'Thỏa thuận',
              why_match: `Phù hợp kỹ năng: ${m.matchedSkills?.join(', ') || 'Chung'}`,
              percent: Math.round(m.score)
            }));
            yield `Hệ thống vừa phân tích hồ sơ của bạn với cơ sở dữ liệu việc làm. Đây là các công việc có độ **Matching Score** phù hợp nhất hiện tại:`;
            yield { type: 'SHOW_JOB_CARDS', payload };
            return;
          }
        }
      } catch (err) {}
    }

    // 1(b). FAST PATH: Candidate's application status
    if (isCandidate && context?.userId && (normalizedMsg.includes('đơn ứng tuyển') || normalizedMsg.includes('việc đã nộp'))) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId: context.userId } });
        if (candidateRecord) {
          const applications = await this.prisma.application.findMany({
            where: { candidateId: candidateRecord.candidateId },
            include: { jobPosting: { include: { company: true } } },
            orderBy: { applyDate: 'desc' },
            take: 5
          });
          if (applications.length > 0) {
            let response = 'Đây là trạng thái 5 đơn ứng tuyển gần nhất của bạn trên hệ thống:\n\n';
            applications.forEach(app => {
              const statusVi = app.appStatus === 'PENDING' ? 'Đang chờ duyệt' :
                app.appStatus === 'REVIEWED' ? 'Đã xem' :
                  app.appStatus === 'INTERVIEWING' ? 'Đang phỏng vấn' :
                    app.appStatus === 'ACCEPTED' ? 'Trúng tuyển' : 'Từ chối';
              response += `- **${app.jobPosting.title}** (Công ty ${app.jobPosting.company.companyName}): Trạng thái **${statusVi}**.\n`;
            });
            yield response;
            return;
          } else {
            yield 'Hiện tại hệ thống không ghi nhận đơn ứng tuyển nào của bạn.';
            return;
          }
        }
      } catch (e) {}
    }

    // 1(c). FAST PATH: Recruiter's wallet
    if (isRecruiter && context?.userId && (normalizedMsg.includes('số dư xu') || normalizedMsg.includes('ví của tôi') || normalizedMsg.includes('còn bao nhiêu xu'))) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
          include: { recruiterWallet: true }
        });
        if (recruiterRecord?.recruiterWallet) {
          yield `Tài khoản ví của bạn hiện đang có: **${new Intl.NumberFormat('vi-VN').format(recruiterRecord.recruiterWallet.balance)} Xu**.\nSố lượt mở khóa CV hiện còn: **${recruiterRecord.recruiterWallet.cvUnlockQuota}** lượt.`;
          return;
        }
      } catch (e) {}
    }

    // 1(d). FAST PATH: Recruiter's active jobs
    if (isRecruiter && context?.userId && (normalizedMsg.includes('tin tuyển dụng đã đăng') || normalizedMsg.includes('danh sách việc làm'))) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({ where: { userId: context.userId } });
        if (recruiterRecord) {
          const jobs = await this.prisma.jobPosting.findMany({
            where: { recruiterId: recruiterRecord.recruiterId },
            select: { status: true }
          });
          const active = jobs.filter(j => j.status === 'APPROVED').length;
          yield `Tổng quan tin tuyển dụng:\n- Đang tuyển: **${active}**\nBạn có thể vào mục "Tin Tuyển Dụng" để quản lý.`;
          return;
        }
      } catch (e) { }
    }

    // ====================================================================
    // RAG LOGIC MỚI KẾT HỢP NL2API (TRÍCH XUẤT Ý ĐỊNH) VÀ CACHE REDIS
    // ====================================================================

    // Bước 1: Trích xuất ý định (Thay thế việc search text cứng)
    const extraction = await this.extractIntent(message);
    let ragContext = '';

    if (context?.userId && !isRecruiter) {
      const userContext = await this.getCandidateRagContext(context.userId);
      if (userContext) ragContext += userContext;
    }

    if (isRecruiter && (extraction.intent === 'create_job' || message.toLowerCase().includes('tuyển'))) {
       const filters = extraction.filters || {};
       let title = filters.title || 'Vị trí tuyển dụng';
       let jobType = 'FULLTIME';

       if (message.toLowerCase().includes('thực tập')) {
           title = 'Thực tập sinh';
           jobType = 'INTERNSHIP';
       } else if (message.toLowerCase().includes('part time') || message.toLowerCase().includes('bán thời gian')) {
           jobType = 'PARTTIME';
       }

       yield 'Hệ thống đã tạo bản nháp tin tuyển dụng cho bạn. Vui lòng kiểm tra và bổ sung thêm thông tin chi tiết trước khi đăng.';
       yield {
          type: 'PREFILL_JOB',
          payload: {
             title,
             vacancies: filters.vacancies || 1,
             salaryMin: filters.min_salary || null,
             salaryMax: filters.max_salary || null,
             jobType,
             hardSkills: filters.keyword ? [filters.keyword] : []
          }
       };
       return;
    }

    if (extraction.intent === 'job_search' || extraction.intent === 'job' || extraction.filters?.keyword) {
      // Bước 2: Tạo Cache Key và kiểm tra Redis
      const kw = extraction.filters?.keyword || 'all';
      const loc = extraction.filters?.location || 'all';
      const sal = extraction.filters?.min_salary || 0;
      
      const cacheKey = `jobs:${kw}:${loc}:${sal}`.toLowerCase().replace(/\s+/g, '-');
      let jobs = [];

      try {
        const cachedStr = await this.redisService.get(cacheKey);
        if (cachedStr) {
          jobs = JSON.parse(cachedStr);
          this.logger.log(`[Cache Hit] ${cacheKey}`);
        } else {
          this.logger.log(`[Cache Miss] ${cacheKey}. Querying DB...`);
          
          // Tìm trong Elasticsearch với searchForRAG
          const searchJobs = await this.searchService.searchJobsForRAG({
            search: extraction.filters?.keyword || message,
            location: extraction.filters?.location,
            limit: 3,
          });

          // Custom Map để hiển thị
          jobs = searchJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company_name: j.companyName || 'Công ty ẩn danh',
            location: j.locationCity || 'Toàn quốc',
            salary: j.salaryMin ? `${j.salaryMin} - ${j.salaryMax} VND` : 'Thoả thuận'
          }));

          // Lọc thủ công bằng salary nếu elasticsearch kết quả (Tùy biến)
          if (sal > 0) {
            jobs = jobs.filter((j: any) => {
               if (j.salary === 'Thoả thuận') return true; 
               const minMatch = j.salary.match(/(\d+)/);
               if (minMatch) {
                 return parseInt(minMatch[1]) >= (sal / 1000000); // So sánh theo triệu
               }
               return true;
            });
          }

          if (jobs.length > 0) {
            // Lưu vào Cache với TTL = 900 giây (15 phút)
            await this.redisService.set(cacheKey, JSON.stringify(jobs), 900);
          }
        }
      } catch (err) {
        this.logger.warn(`Redis/Search Error: ${err.message}`);
      }

      if (jobs && jobs.length > 0) {
        ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP TỪ DATABASE ---\n${JSON.stringify(jobs)}\n`;
        // Đẩy Action ra UI (Bước 4)
        yield { type: 'SHOW_JOB_CARDS', payload: jobs };
      }
    }

    // Bước 3: Đẩy vào mô hình LLM Streaming
    let systemPrompt: string;
    if (isRecruiter) {
      systemPrompt = `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Tư vấn các vấn đề tuyển dụng.
        NGỮ CẢNH: ${ragContext || 'Chưa nhận diện công ty.'}
        PHẠM VI: Viết JD, đánh giá ứng viên, tư vấn lương, xu hướng thị trường.
        NGUYÊN TẮC: Ngắn gọn, súc tích (150 từ), từ chối câu hỏi ngoài lề.
        CÂU HỎI: ${message}`;
    } else {
      systemPrompt = `Bạn là Workly-AI, SIÊU CỐ VẤN NGHỀ NGHIỆP cho ỨNG VIÊN.
        NGỮ CẢNH: ${ragContext || 'Chưa nhận diện ứng viên.'}
        PHẠM VI: Tìm việc, sửa CV, kỹ năng phỏng vấn, định hướng nghề nghiệp. Mục tiêu là giúp người tìm việc thành công.
        NGUYÊN TẮC VÀNG: Trình bày Markdown sạch sẽ, không xưng tôi, tối đa 200 từ. KHÔNG dùng "Dựa trên hồ sơ của bạn...".
        CÂU HỎI: ${message}`;
    }

    const preferredModels = ['gemini-2.5-flash', 'gemini-1.5-flash-latest', 'gemini-2.0-flash', 'gemini-flash-latest'];
    let success = false;
    let lastError: any = null;

    for (const modelId of preferredModels) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelId });
        const result = await model.generateContentStream(systemPrompt);
        let fullResponse = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            fullResponse += text;
            yield text;
          }
        }
        if (fullResponse.trim()) {
          this.prisma.aiQueryCache.create({
            data: { query: normalizedMsg, response: fullResponse }
          }).catch(() => { });
          success = true;
          break;
        }
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Model ${modelId} failed: ${error.message}`);
        await SLEEP(1000);
      }
    }

    if (!success) {
      this.logger.error(`RAG failed, trying direct fallback. Error: ${lastError?.message}`);
      const fallbacks = ['gemini-2.5-flash', 'gemini-1.5-flash-8b'];
      for (const fId of fallbacks) {
        try {
          const model = this.genAI.getGenerativeModel({ model: fId });
          const result = await model.generateContentStream(message);
          for await (const chunk of result.stream) {
            yield chunk.text();
          }
          return;
        } catch (e: any) {
          this.logger.warn(`Fallback ${fId} failed.`);
        }
      }
      yield '\n[Hệ thống]: Hiện tại máy chủ AI đang quá tải. Vui lòng thử lại sau.';
    }
  }
}
