import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SearchService } from '@/modules/intelligence/search/search.service';
import { AiChatContextService } from './services/ai-chat-context.service';
import { AiChatIntentService } from './services/ai-chat-intent.service';
import { AiChatResponseService } from './services/ai-chat-response.service';
import { AiResilienceUtil } from './utils/ai-resilience.util';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: SearchService,
    private readonly contextService: AiChatContextService,
    private readonly intentService: AiChatIntentService,
    private readonly responseService: AiChatResponseService,
  ) {}

  async generateResponse(message: string): Promise<string> {
    return this.responseService.generateResponse(message);
  }

  async *generateStreamResponse(
    message: string,
    userId?: string,
    roles?: string[],
    contextMode?: string,
    jobSlug?: string,
  ): AsyncGenerator<string, void, unknown> {
    const stream = this.processChatWithRAGStream(message, {
      userId,
      roles,
      contextMode,
      jobSlug,
    });
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
    context?: { userId?: string; roles?: string[]; contextMode?: string; jobSlug?: string },
  ): AsyncGenerator<any, void, unknown> {
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

    const isPersonalQuery = [
      'tôi', 'mình', 'em', 'của tôi', 'cv', 'hồ sơ', 'kinh nghiệm',
      'độ phù hợp', 'công việc này', 'job này', 'tin này', 'ứng tuyển',
      'đánh giá', 'cho t', 'của t'
    ].some((keyword) => normalizedMsg.includes(keyword));

    const shouldCache = !isPersonalQuery && !context?.jobSlug;

    // 1. Plan & Upsell Context
    let recruiterPlanType: string | null = null;
    let upsellContext = '';
    if (isRecruiter && context?.userId) {
      const planInfo = await this.contextService.getRecruiterPlanInfo(
        context.userId,
      );
      recruiterPlanType = planInfo.planType;
      upsellContext = planInfo.upsellContext;
    }

    // 2. Fast Paths
    if (context?.userId) {
      if (isCandidate) {
        const fastPath = await this.intentService.handleCandidateFastPaths(
          normalizedMsg,
          context.userId,
        );
        if (fastPath) {
          yield fastPath.text;
          if (fastPath.action) yield fastPath.action;
          return;
        }
      }
      if (isRecruiter) {
        const fastPath = await this.intentService.handleRecruiterFastPaths(
          normalizedMsg,
          context.userId,
        );
        if (fastPath) {
          yield fastPath.text;
          if (fastPath.action) yield fastPath.action;
          return;
        }
      }
    }

    // 3. Job Posting Extraction (Recruiter only)
    if (
      isRecruiter &&
      this.intentService.isJobPostingIntent(normalizedMsg) &&
      message.length > 5
    ) {
      if (!recruiterPlanType) {
        yield 'Hệ thống nhận thấy bạn muốn tạo tin tuyển dụng. Tuy nhiên, tính năng AI tự động sinh JD chỉ hỗ trợ các tài khoản nâng cấp (LITE hoặc GROWTH).';
        yield {
          type: 'SHOW_UPGRADE_CTA',
          payload: {
            title: 'Mở khóa tính năng Tự động sinh JD',
            subtitle:
              'Dùng trợ lý AI chuyên nghiệp tự động điền thông tin và tối ưu SEO.',
            ctaText: 'Nâng cấp ngay',
            ctaLink: '/recruiter/billing/plans',
          },
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
    if (shouldCache) {
      try {
        const cached = await this.prisma.aiQueryCache.findUnique({
          where: { query: normalizedMsg },
        });
        if (cached) {
          yield cached.response;
          return;
        }
      } catch (e) {}
    }

    // 5. Build RAG Context & Call LLM
    let success = false;

    try {
      const startTime = Date.now();
      let ragContext = '';

      if (context?.userId) {
        const userContext = await this.contextService.getCandidateRagContext(
          context.userId,
        );
        if (userContext) ragContext += userContext;
      }

      if (context?.jobSlug) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(context.jobSlug);
        const job = await this.prisma.jobPosting.findFirst({
          where: isUuid ? { jobPostingId: context.jobSlug } : { slug: context.jobSlug },
          select: { title: true, requirements: true, structuredRequirements: true, description: true }
        });
        if (job) {
          const struct = (job.structuredRequirements as any) || {};
          const hardSkills = Array.isArray(struct.hardSkills) ? struct.hardSkills : [];
          ragContext += `\n--- [CÔNG VIỆC ĐANG XEM HIỆN TẠI] ---\nCông việc: ${job.title}\nYêu cầu: ${job.requirements}\nKỹ năng yêu cầu: ${hardSkills.join(', ')}\nNếu ứng viên hỏi về công việc này, hãy phân tích độ phù hợp dựa trên thông tin trên.\n`;
        }
      }

      const isJobSearch = [
        'tìm việc',
        'kiếm việc',
        'gợi ý việc',
        'tìm job',
        'có việc nào',
        'công việc phù hợp',
      ].some((phrase) => normalizedMsg.includes(phrase));
      if (isJobSearch) {
        const expandedKeywords =
          await this.responseService.expandSearchQuery(message);
        const jobs = await this.searchService.searchJobsForRAG({
          search: message,
          expandedKeywords,
          limit: 3,
        });
        if (jobs && jobs.length > 0) {
          const formattedJobs = jobs.map((j: any) => ({
            id: j.id,
            title: j.title,
            companyName: j.companyName || 'Công ty ẩn danh',
            location: j.locationCity || 'Toàn quốc',
            salary: j.salaryMin
              ? `${Math.floor(Number(j.salaryMin) / 1000000)} triệu - ${Math.floor(Number(j.salaryMax) / 1000000)} triệu VND`
              : 'Thỏa thuận',
            percent: 85,
            why_match: 'Phù hợp với từ khóa tìm kiếm của bạn'
          }));
          ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP (Market Data) ---\n${JSON.stringify(jobs)}\n`;
          yield { type: 'SHOW_JOB_CARDS', payload: formattedJobs };
        }
      }

      const systemPrompt = isRecruiter
        ? `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Chỉ tư vấn các vấn đề tuyển dụng.\nNGỮ CẢNH DỮ LIỆU: ${ragContext}\n${upsellContext}`
        : `Bạn là Workly-AI dành cho ỨNG VIÊN. Chỉ tư vấn các vấn đề tìm việc.\nNGỮ CẢNH DỮ LIỆU: ${ragContext}`;

      const groqKey = process.env.GROQ_API_KEY;
      if (!groqKey) {
        throw new Error('GROQ_API_KEY is missing');
      }

      const axios = require('axios');
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
          temperature: 0.3,
          stream: true,
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            'Content-Type': 'application/json',
          },
          responseType: 'stream',
        },
      );

      const stream = response.data;
      const decoder = new TextDecoder('utf-8');
      let fullText = '';
      let buffer = '';

      for await (const chunk of stream) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
            try {
              const data = JSON.parse(trimmed.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                fullText += content;
                yield content;
              }
            } catch (e) {}
          }
        }
      }

      if (fullText) {
        success = true;
        const duration = Date.now() - startTime;
        this.logger.log(
          `[AI Chat] Successfully generated response using Groq LLaMA 3.3 in ${duration}ms`,
        );
        if (shouldCache) {
          this.prisma.aiQueryCache
            .create({ data: { query: normalizedMsg, response: fullText } })
            .catch(() => {});
        }
      }
    } catch (e: any) {
      this.logger.warn(`[AI Chat] Groq model failed: ${e.message}`);
    }

    if (!success) {
      this.logger.error(
        `[AI Chat] All models failed for query: "${normalizedMsg}"`,
      );
      yield 'Hệ thống AI đang xử lý quá nhiều yêu cầu hoặc gặp sự cố kết nối. Vui lòng thử lại sau vài giây.';
    }
  }

  async getCandidateRagContext(userId: string) {
    return this.contextService.getCandidateRagContext(userId);
  }

  async expandSearchQuery(message: string) {
    return this.responseService.expandSearchQuery(message);
  }
}
