import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AiChatContextService } from './services/ai-chat-context.service';
import { AiChatIntentService } from './services/ai-chat-intent.service';
import { AiChatResponseService } from './services/ai-chat-response.service';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly contextService: AiChatContextService,
    private readonly intentService: AiChatIntentService,
    private readonly responseService: AiChatResponseService,
  ) { }

  async generateResponse(message: string): Promise<string> {
    return this.responseService.generateResponse(message);
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
    roles?: string[],
    contextMode?: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.processChatWithRAGStream(message, { userId, roles, contextMode });
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
    context?: { userId?: string; roles?: string[]; contextMode?: string; },
  ): AsyncGenerator<any, void, unknown> {
    const userRoles = context?.roles || [];
    const forceMode = context?.contextMode;
    const isRecruiter = forceMode === 'RECRUITER' || (!forceMode && userRoles.includes('RECRUITER'));
    const isCandidate = forceMode === 'CANDIDATE' || (!forceMode && (userRoles.includes('CANDIDATE') || userRoles.length === 0));

    const normalizedMsg = message.trim().toLowerCase();

    // 1. Plan & Upsell Context
    let recruiterPlanType: string | null = null;
    let upsellContext = '';
    if (isRecruiter && context?.userId) {
      const planInfo = await this.contextService.getRecruiterPlanInfo(context.userId);
      recruiterPlanType = planInfo.planType;
      upsellContext = planInfo.upsellContext;
    }

    // 2. Fast Paths
    if (context?.userId) {
      if (isCandidate) {
        const fastPath = await this.intentService.handleCandidateFastPaths(normalizedMsg, context.userId);
        if (fastPath) {
          yield fastPath.text;
          if (fastPath.action) yield fastPath.action;
          return;
        }
      }
      if (isRecruiter) {
        const fastPath = await this.intentService.handleRecruiterFastPaths(normalizedMsg, context.userId);
        if (fastPath) {
          yield fastPath.text;
          if (fastPath.action) yield fastPath.action;
          return;
        }
      }
    }

    // 3. Job Posting Extraction (Recruiter only)
    if (isRecruiter && this.intentService.isJobPostingIntent(normalizedMsg) && message.length > 5) {
      if (!recruiterPlanType) {
        yield 'Hệ thống nhận thấy bạn muốn tạo tin tuyển dụng. Tuy nhiên, tính năng AI tự động sinh JD chỉ hỗ trợ các tài khoản nâng cấp (LITE hoặc GROWTH).';
        yield {
          type: 'SHOW_UPGRADE_CTA',
          payload: { title: 'Mở khóa tính năng Tự động sinh JD', subtitle: 'Dùng trợ lý AI chuyên nghiệp tự động điền thông tin và tối ưu SEO.', ctaText: 'Nâng cấp ngay', ctaLink: '/recruiter/billing/plans' }
        };
        return;
      }

      const extracted = await this.responseService.extractJobData(message);
      if (extracted) {
        yield `Tuyệt vời! Tôi đã phân tích yêu cầu của bạn bằng **${extracted.usedAI}**, tự động viết văn phong chuyên nghiệp và điền sẵn các thông số vào biểu mẫu đăng tin.`;
        yield { type: 'PREFILL_JOB', payload: extracted.jobData };
        return;
      }
    }

    // 4. Cache Check
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({ where: { query: normalizedMsg } });
      if (cached) {
        yield cached.response;
        return;
      }
    } catch (e) {}

    // 5. Build RAG Context & Call LLM
    const models = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'];
    let success = false;

    for (const modelId of models) {
      if (success) break;
      try {
        const model = this.responseService.getGenAI().getGenerativeModel({ model: modelId });
        let ragContext = '';

        if (context?.userId) {
          const userContext = await this.contextService.getCandidateRagContext(context.userId);
          if (userContext) ragContext += userContext;
        }

        const isJobSearch = ['tìm việc', 'kiếm việc', 'gợi ý việc', 'tìm job', 'có việc nào', 'công việc phù hợp'].some((phrase) => normalizedMsg.includes(phrase));
        if (isJobSearch) {
          const expandedKeywords = await this.responseService.expandSearchQuery(message);
          const jobs = await this.searchService.searchJobsForRAG({ search: message, expandedKeywords, limit: 3 });
          if (jobs && jobs.length > 0) {
            ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP (Market Data) ---\n${JSON.stringify(jobs)}\n`;
            yield { type: 'SHOW_JOB_CARDS', payload: jobs };
          }
        }

        const systemPrompt = isRecruiter 
          ? `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Chỉ tư vấn các vấn đề tuyển dụng.\nNGỮ CẢNH DỮ LIỆU: ${ragContext}\n${upsellContext}`
          : `Bạn là Workly-AI dành cho ỨNG VIÊN. Chỉ tư vấn các vấn đề tìm việc.\nNGỮ CẢNH DỮ LIỆU: ${ragContext}`;

        const chat = model.startChat({ history: [], systemInstruction: systemPrompt });
        const result = await chat.sendMessageStream(message);

        let fullText = '';
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          yield chunkText;
        }

        if (fullText) {
          success = true;
          this.prisma.aiQueryCache.create({ data: { query: normalizedMsg, response: fullText } }).catch(() => {});
        }
      } catch (e) {
        this.logger.warn(`Model ${modelId} failed, trying next...`);
      }
    }

    if (!success) yield 'Hệ thống AI đang quá tải hoặc gặp lỗi. Vui lòng thử lại sau.';
  }

  async getCandidateRagContext(userId: string) {
    return this.contextService.getCandidateRagContext(userId);
  }

  async expandSearchQuery(message: string) {
    return this.responseService.expandSearchQuery(message);
  }
}
