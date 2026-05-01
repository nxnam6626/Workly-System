import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '@/modules/intelligence/search/search.service';
import { RedisService } from '@/redis/redis.service';
import { AiChatContextService } from './services/ai-chat-context.service';
import { AiChatIntentService } from './services/ai-chat-intent.service';
import { AiChatResponseService } from './services/ai-chat-response.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly redisService: RedisService,
    private readonly intentService: AiChatIntentService,
    private readonly contextService: AiChatContextService,
    private readonly responseService: AiChatResponseService,
  ) {}

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

  async *processChatWithRAGStream(
    message: string,
    context?: { userId?: string; roles?: string[] },
  ): AsyncGenerator<any, void, unknown> {
    const userId = context?.userId;
    const roles = context?.roles || [];
    const isRecruiter = roles.includes('RECRUITER');
    const normalizedMsg = message.trim().toLowerCase();

    // 1. FAST PATHS (Intent detection + Business Logic)
    if (userId) {
      const fastPathResult = isRecruiter
        ? await this.intentService.handleRecruiterFastPaths(
            normalizedMsg,
            userId,
          )
        : await this.intentService.handleCandidateFastPaths(
            normalizedMsg,
            userId,
          );

      if (fastPathResult) {
        if (fastPathResult.text) yield fastPathResult.text;
        if (fastPathResult.action) yield fastPathResult.action;
        return;
      }
    }

    // 2. INTENT EXTRACTION (NL2API)
    const extraction = await this.intentService.extractIntent(message);

    // 3. PREFILL JOB (Recruiter intent)
    if (
      isRecruiter &&
      (extraction.intent === 'create_job' ||
        message.toLowerCase().includes('tuyển'))
    ) {
      const filters = extraction.filters || {};
      let title = filters.title || 'Vị trí tuyển dụng';
      let jobType = 'FULLTIME';

      if (message.toLowerCase().includes('thực tập')) {
        title = 'Thực tập sinh';
        jobType = 'REMOTE';
      } else if (
        message.toLowerCase().includes('part time') ||
        message.toLowerCase().includes('bán thời gian')
      ) {
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
          hardSkills: filters.keyword ? [filters.keyword] : [],
        },
      };
      return;
    }

    // 4. CONTEXT BUILDING (RAG)
    let ragContext = '';
    if (userId) {
      if (isRecruiter) {
        const { upsellContext } =
          await this.contextService.getRecruiterPlanInfo(userId);
        ragContext += upsellContext;
      } else {
        ragContext += await this.contextService.getCandidateRagContext(userId);
      }
    }

    // 5. JOB SEARCH (RAG - Jobs)
    if (
      extraction.intent === 'job_search' ||
      extraction.intent === 'job' ||
      extraction.filters?.keyword
    ) {
      const kw = extraction.filters?.keyword || 'all';
      const loc = extraction.filters?.location || 'all';
      const sal = extraction.filters?.min_salary || 0;
      const cacheKey = `jobs:${kw}:${loc}:${sal}`
        .toLowerCase()
        .replace(/\s+/g, '-');

      let jobs = [];
      try {
        const cachedStr = await this.redisService.get(cacheKey);
        if (cachedStr) {
          jobs = JSON.parse(cachedStr);
        } else {
          const searchJobs = await this.searchService.searchJobsForRAG({
            search: extraction.filters?.keyword || message,
            location: extraction.filters?.location,
            limit: 3,
          });

          jobs = searchJobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            company_name: j.companyName || 'Công ty ẩn danh',
            location: j.locationCity || 'Toàn quốc',
            salary: j.salaryMin
              ? `${j.salaryMin} - ${j.salaryMax} VND`
              : 'Thoả thuận',
          }));

          if (sal > 0) {
            jobs = jobs.filter((j: any) => {
              if (j.salary === 'Thoả thuận') return true;
              const minMatch = j.salary.match(/(\d+)/);
              return minMatch ? parseInt(minMatch[1]) >= sal / 1000000 : true;
            });
          }

          if (jobs.length > 0) {
            await this.redisService.set(cacheKey, JSON.stringify(jobs), 900);
          }
        }
      } catch (err) {}

      if (jobs.length > 0) {
        ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP TỪ DATABASE ---\n${JSON.stringify(jobs)}\n`;
        yield { type: 'SHOW_JOB_CARDS', payload: jobs };
      }
    }

    // 6. LLM RESPONSE (Streaming)
    const systemPrompt = isRecruiter
      ? `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Tư vấn các vấn đề tuyển dụng.
        NGỮ CẢNH: ${ragContext || 'Chưa nhận diện công ty.'}
        PHẠM VI: Viết JD, đánh giá ứng viên, tư vấn lương, xu hướng thị trường.
        NGUYÊN TẮC: Ngắn gọn, súc tích (150 từ), từ chối câu hỏi ngoài lề.
        CÂU HỎI: ${message}`
      : `Bạn là Workly-AI, SIÊU CỐ VẤN NGHỀ NGHIỆP cho ỨNG VIÊN.
        NGỮ CẢNH: ${ragContext || 'Chưa nhận diện ứng viên.'}
        PHẠM VI: Tìm việc, sửa CV, kỹ năng phỏng vấn, định hướng nghề nghiệp. Mục tiêu là giúp người tìm việc thành công.
        NGUYÊN TẮC VÀNG: Trình bày Markdown sạch sẽ, không xưng tôi, tối đa 200 từ. KHÔNG dùng "Dựa trên hồ sơ của bạn...".
        CÂU HỎI: ${message}`;

    const stream = this.responseService.generateStreamResponse(
      systemPrompt,
      message,
    );
    for await (const chunk of stream) {
      yield chunk;
    }
  }
}
