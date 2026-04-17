import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiInsightsService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiInsightsService.name);

  constructor(private readonly prisma: PrismaService) {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  async generateRecruiterInsights(userId: string): Promise<any> {
    if (!this.isConfigured) return { insights: [], stats: [], jdScores: [] };

    // 1. Fetch ALL recruiter jobs (no take limit) + subscription for accurate stats
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: {
        recruiterSubscription: true,
        jobPostings: {
          where: { status: { in: ['APPROVED', 'PENDING', 'EXPIRED'] } },
          orderBy: { updatedAt: 'desc' },
          include: { _count: { select: { applications: true } } },
        },
      },
    });

    if (!recruiter) return { insights: [], stats: [], jdScores: [] };

    const allJobs = recruiter.jobPostings;

    // Stats: chỉ tính tin APPROVED (đang công khai, có lượt xem thực)
    const activeJobs = allJobs.filter((j) => j.status === 'APPROVED');
    const totalViews = activeJobs.reduce(
      (sum, j) => sum + (j.viewCount || 0),
      0,
    );
    const totalApplicants = activeJobs.reduce(
      (sum, j) => sum + j._count.applications,
      0,
    );
    const avgApplyRate =
      totalViews > 0 ? ((totalApplicants / totalViews) * 100).toFixed(1) : '0';

    // 2. Compute cache key from actual data fingerprint (removing totalViews to prevent excessive cache busting)
    const latestUpdate = allJobs[0]?.updatedAt?.getTime() ?? 0;
    const cacheKey = `${allJobs.length}:${latestUpdate}:${totalApplicants}_v8`;

    const cachedPayload = recruiter.aiInsightsCache as any;

    // 2.5 Check TTL to aggressively save tokens (Cache stays valid for 4 hours regardless of minor changes)
    const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
    const isCacheFresh =
      recruiter.aiInsightsCachedAt &&
      Date.now() - new Date(recruiter.aiInsightsCachedAt).getTime() < CACHE_TTL_MS;

    // 3. Return full cache if overall data signature unchanged OR cache is still fresh enough
    if (cachedPayload && (recruiter.aiInsightsCacheKey === cacheKey || isCacheFresh)) {
      this.logger.log(
        `[AiInsightsService] Returning cached AI insights for recruiter ${recruiter.recruiterId} (Fresh: ${!!isCacheFresh})`,
      );
      // Update stats on the fly without calling Gemini
      return {
        ...cachedPayload,
        stats: {
          totalJobs: allJobs.length,
          activeJobs: activeJobs.length,
          totalViews,
          totalApplicants,
          avgApplyRate: parseFloat(avgApplyRate),
        }
      };
    }

    // 4. Extract individual JD scores using per-JD caching
    const finalJdScores: any[] = [];
    const jobsNeedingAnalysis: any[] = [];

    // Lấy tối đa 15 job gần nhất để phân tích tổng quan
    const jobsForAnalysis = activeJobs.slice(0, 15);

    for (const job of jobsForAnalysis) {
      const struct = (job.structuredRequirements as any) || {};
      const aiAnalysis = struct.aiAnalysis;

      // Nếu job đã được phân tích và bản phân tích mới hơn ngày cập nhật job
      if (
        aiAnalysis &&
        aiAnalysis.score !== undefined &&
        new Date(aiAnalysis.analyzedAt) >= job.updatedAt
      ) {
        finalJdScores.push({ id: job.jobPostingId, ...aiAnalysis });
      } else {
        jobsNeedingAnalysis.push(job);
      }
    }

    // Phân tích riêng lẻ các JD mới hoặc vừa được chỉnh sửa
    if (jobsNeedingAnalysis.length > 0) {
      const unanalyzedSummary = jobsNeedingAnalysis.map((j) => ({
        id: j.jobPostingId,
        title: j.title,
        views: j.viewCount || 0,
        applicants: j._count.applications,
        hasSalary: !!(j.salaryMin || j.salaryMax),
        descLength: (j.description || '').length,
        daysAgo: Math.floor(
          (Date.now() - new Date(j.createdAt).getTime()) / 86400000,
        ),
      }));

      const jdPrompt = `Bạn là chuyên gia tư vấn tuyển dụng AI. Đánh giá ĐIỂM SỐ cho các JD sau. Phân tích thêm điểm yếu và điểm mạnh (không dùng markdown).
DỮ LIỆU JD (chỉ những JD mới/cập nhật): ${JSON.stringify(unanalyzedSummary)}
Trả về JSON thuần:
{"jdScores":[{"id":"ID của JD", "title":"Tên JD", "score":0-100, "trend":"up|down|stable", "reason":"<=60 ký tự", "weaknesses":["1-2 điểm yếu ngắn gọn"],"strengths":["1-2 điểm mạnh"]}]}
Quy tắc: hasSalary +20, descLength 400-800 +20, applicants/views tốt +25, daysAgo<7 +15`;

      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(jdPrompt);
          const raw = result.response
            .text()
            .replace(/```json/gi, '')
            .replace(/```/gi, '')
            .trim();
          const parsed = JSON.parse(raw);

          if (parsed.jdScores) {
            for (const scoreObj of parsed.jdScores) {
              finalJdScores.push(scoreObj);
              // Lưu cache ngược lại DB theo từng JD
              const jobData = jobsNeedingAnalysis.find(
                (j) => j.jobPostingId === scoreObj.id,
              );
              if (jobData) {
                const struct = jobData.structuredRequirements || {};
                struct.aiAnalysis = {
                  ...scoreObj,
                  analyzedAt: new Date().toISOString(),
                };
                await this.prisma.jobPosting.update({
                  where: { jobPostingId: scoreObj.id },
                  data: { structuredRequirements: struct },
                });
              }
            }
          }
          this.logger.log(
            `[AiInsightsService] Analyzed ${jobsNeedingAnalysis.length} missing JDs with ${modelName}`,
          );
          break; // success
        } catch (e) {
          console.error(`Missing JD Analysis failed with ${modelName}`);
          await SLEEP(500);
        }
      }
    }

    // 4.5 Fallback: Ensure all jobs have a score if Gemini failed
    for (const job of jobsForAnalysis) {
      if (!finalJdScores.find((s) => s.id === job.jobPostingId)) {
        let score = 0;
        const hasSalary = !!(job.salaryMin || job.salaryMax);
        if (hasSalary) score += 20;
        const descLength = (job.description || '').length;
        if (descLength >= 400 && descLength <= 800) score += 20;
        else if (descLength > 800) score += 10;
        else if (descLength > 100) score += 5;
        const applicants = job._count?.applications || 0;
        const views = job.viewCount || 0;
        if (views > 0 && applicants / views > 0.05) score += 25;
        else if (views > 0 && applicants / views > 0.02) score += 12;
        const daysAgo = Math.floor(
          (Date.now() - new Date(job.createdAt).getTime()) / 86400000,
        );
        if (daysAgo < 7) score += 15;
        if (job.status === 'APPROVED') score += 20;

        const trend = daysAgo < 3 ? 'up' : daysAgo > 14 ? 'down' : 'stable';
        const weaknesses: string[] = [];
        const strengths: string[] = [];
        if (!hasSalary) weaknesses.push('Thiếu mức lương cụ thể');
        else strengths.push('Có mức lương rõ ràng');
        if (descLength < 300) weaknesses.push('Mô tả việc làm quá ngắn');
        else if (descLength >= 400 && descLength <= 800)
          strengths.push('Mô tả chi tiết chuẩn SEO');
        if (views > 0 && applicants / views > 0.05)
          strengths.push('Tỉ lệ chuyển đổi ấn tượng');

        finalJdScores.push({
          id: job.jobPostingId,
          title: job.title,
          score: Math.min(score, 100),
          trend,
          reason: hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu mức lương',
          weaknesses,
          strengths,
        });
      }
    }

    const stats = {
      totalJobs: allJobs.length,
      activeJobs: activeJobs.length,
      totalViews,
      totalApplicants,
      avgApplyRate: parseFloat(avgApplyRate),
    };

    const prompt = `Bạn là chuyên gia tư vấn tuyển dụng AI. Phân tích dữ liệu thực tế sau và trả về JSON thuần Insights tổng quan thống kê (không backtick):

DỮ LIỆU:
- Tổng lượt xem: ${totalViews} | Ứng viên nộp: ${totalApplicants} | Tỉ lệ: ${avgApplyRate}%
- Tình trạng các JD: ${JSON.stringify(finalJdScores.map((s) => ({ title: s.title, score: s.score, weaknesses: s.weaknesses })))}

Trả về JSON:
{"insights":[{"type":"warning|tip|success","title":"<=60 ký tự","desc":"<=150 ký tự gợi ý hành động","priority":"high|medium|low"}],"summary":"1-2 câu tổng quan thống kê chung"}
Tối đa 3 insights hành động dựa vào điểm yếu của các JD.`;

    // 5. Try Gemini models cho phân tích tổng quan
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-8b',
    ];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response
          .text()
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          .trim();
        const parsed = JSON.parse(raw);

        const payload = {
          insights: parsed.insights || [],
          jdScores: finalJdScores || [], // Nhúng array đã thu thập được ở bước 4 vào
          summary: parsed.summary || '',
          stats,
          cachedAt: new Date().toISOString(),
          fromCache: false,
        };

        await this.prisma.recruiter.update({
          where: { recruiterId: recruiter.recruiterId },
          data: {
            aiInsightsCache: payload as any,
            aiInsightsCacheKey: cacheKey,
            aiInsightsCachedAt: new Date(),
          },
        });

        this.logger.log(
          `[AiInsightsService] AI insights generated with ${modelName} and cached.`,
        );
        return payload;
      } catch (e: any) {
        this.logger.warn(
          `[AiInsightsService] recruiterInsights failed with ${modelName}: ${e.message?.substring(0, 120)}`,
        );
        await SLEEP(1000);
      }
    }

    // 6. Rule-based fallback
    this.logger.warn(
      '[AiInsightsService] All Gemini models failed. Running rule-based fallback analysis.',
    );

    const jobSummary = jobsForAnalysis.map((j: any) => ({
      id: j.jobPostingId,
      title: j.title,
      status: j.status,
      views: j.viewCount || 0,
      applicants: j._count.applications,
      hasSalary: !!(j.salaryMin || j.salaryMax),
      descLength: (j.description || '').length,
      daysAgo: Math.floor(
        (Date.now() - new Date(j.createdAt).getTime()) / 86400000,
      ),
      autoFixedByAI: !!(j.structuredRequirements as any)?.autoFixedByAI,
    }));

    const ruleInsights: any[] = [];
    const ruleJdScores = jobSummary
      .filter((j: any) => j.status === 'APPROVED') // chỉ lấy tin đang chạy
      .map((j: any) => {
        let score = 0;
        if (j.hasSalary) score += 20;
        if (j.descLength >= 400 && j.descLength <= 800) score += 20;
        else if (j.descLength > 800) score += 10;
        else if (j.descLength > 100) score += 5;
        if (j.views > 0 && j.applicants / j.views > 0.05) score += 25;
        else if (j.views > 0 && j.applicants / j.views > 0.02) score += 12;
        if (j.daysAgo < 7) score += 15;
        if (j.status === 'APPROVED') score += 20;
        const trend = j.daysAgo < 3 ? 'up' : j.daysAgo > 14 ? 'down' : 'stable';
        const fallbackWeaknesses: string[] = [];
        const fallbackStrengths: string[] = [];
        if (!j.hasSalary) fallbackWeaknesses.push('Thiếu mức lương cụ thể');
        else fallbackStrengths.push('Có mức lương rõ ràng');

        if (j.descLength < 300)
          fallbackWeaknesses.push('Mô tả việc làm quá ngắn');
        else if (j.descLength >= 400 && j.descLength <= 800)
          fallbackStrengths.push('Mô tả chi tiết chuẩn SEO');

        if (j.views > 0 && j.applicants / j.views > 0.05)
          fallbackStrengths.push('Tỉ lệ chuyển đổi ứng viên rất tốt');

        return {
          id: j.id,
          title: j.title,
          score: Math.min(score, 100),
          trend,
          reason: j.hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu mức lương',
          weaknesses: fallbackWeaknesses,
          strengths: fallbackStrengths,
        };
      });

    const noSalaryJobs = jobSummary.filter((j: any) => !j.hasSalary);
    if (noSalaryJobs.length > 0) {
      ruleInsights.push({
        type: 'warning',
        title: `${noSalaryJobs.length} JD chưa khai báo mức lương`,
        desc: `Bổ sung mức lương cho ${noSalaryJobs
          .map((j: any) => j.title)
          .slice(0, 2)
          .join(', ')} để tăng ~35% lượt apply.`,
        priority: 'high',
        jobRefs: noSalaryJobs
          .map((j: any) => ({ id: j.id, title: j.title, autoFixedByAI: j.autoFixedByAI }))
          .filter((r: any) => r.id),
      });
    }
    const shortDescJobs = jobSummary.filter(
      (j: any) => j.descLength < 300 && j.descLength > 0,
    );
    if (shortDescJobs.length > 0) {
      ruleInsights.push({
        type: 'tip',
        title: 'Mô tả JD quá ngắn, cần bổ sung thêm',
        desc: `${shortDescJobs.length} JD có mô tả dưới 300 ký tự. Mô tả chi tiết 500-800 ký tự đạt hiệu quả cao nhất.`,
        priority: 'medium',
        jobRefs: shortDescJobs
          .map((j: any) => ({ id: j.id, title: j.title, autoFixedByAI: j.autoFixedByAI }))
          .filter((r: any) => r.id),
      });
    }
    const lowApplyRate = parseFloat(avgApplyRate) < 3 && totalViews > 10;
    if (lowApplyRate) {
      ruleInsights.push({
        type: 'tip',
        title: 'Tỉ lệ apply/view thấp hơn ngưỡng tốt',
        desc: `Tỉ lệ ${avgApplyRate}% thấp hơn chuẩn 5%. Xem xét cải thiện tiêu đề JD và thêm quyền lợi hấp dẫn.`,
        priority: 'medium',
      });
    }
    if (activeJobs.length > 0 && ruleInsights.length === 0) {
      ruleInsights.push({
        type: 'success',
        title: 'Tài khoản hoạt động ổn định',
        desc: `Bạn có ${activeJobs.length} tin đang mở với tổng ${totalApplicants} ứng viên. Tiếp tục duy trì để tối ưu kết quả tuyển dụng.`,
        priority: 'low',
      });
    }

    const summaryText =
      activeJobs.length === 0
        ? 'Chưa có tin nào được duyệt. Hãy đăng tin tuyển dụng để AI phân tích!'
        : `Tổng ${activeJobs.length} tin đang mở với ${totalViews} lượt xem và ${totalApplicants} ứng viên nộp (tỉ lệ ${avgApplyRate}%).`;

    const fallbackPayload = {
      insights: ruleInsights.slice(0, 3),
      jdScores: ruleJdScores,
      summary: summaryText,
      stats,
      cachedAt: new Date().toISOString(),
      fromCache: false,
      ruleBasedFallback: true,
    };

    await this.prisma.recruiter
      .update({
        where: { recruiterId: recruiter.recruiterId },
        data: {
          aiInsightsCache: fallbackPayload as any,
          aiInsightsCacheKey: cacheKey,
          aiInsightsCachedAt: new Date(),
        },
      })
      .catch(() => {});

    return fallbackPayload;
  }
}
