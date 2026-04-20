import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

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

  async generateRecruiterInsights(userId: string, forceRefresh: boolean = false): Promise<any> {
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
    const cacheKey = `${allJobs.length}:${latestUpdate}:${totalApplicants}_v11`;

    const cachedPayload = recruiter.aiInsightsCache as any;

    // 2.5 Check TTL to aggressively save tokens (Cache stays valid for 4 hours regardless of minor changes)
    const CACHE_TTL_MS = 4 * 60 * 60 * 1000;
    const isCacheFresh =
      recruiter.aiInsightsCachedAt &&
      Date.now() - new Date(recruiter.aiInsightsCachedAt).getTime() < CACHE_TTL_MS;

    // 3. Return full cache if overall data signature unchanged OR cache is still fresh enough
    if (!forceRefresh && cachedPayload && (recruiter.aiInsightsCacheKey === cacheKey || isCacheFresh)) {
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

    // Chỉ phân tích những tin tuyển dụng đang mở (APPROVED)
    const jobsForAnalysis = activeJobs;

    for (const job of jobsForAnalysis) {
      const struct = (job.structuredRequirements as any) || {};
      const aiAnalysis = struct.aiAnalysis;

      // Nếu job đã được phân tích và bản phân tích mới hơn ngày cập nhật job (kèm version 15 mới nhất)
      if (
        aiAnalysis && aiAnalysis.version === 15 &&
        aiAnalysis.score !== undefined &&
        new Date(aiAnalysis.analyzedAt) >= job.updatedAt
      ) {
        finalJdScores.push({ id: job.jobPostingId, ...aiAnalysis, autoFixedByAI: struct?.autoFixedByAI });
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
        descriptionContent: (j.description || '').replace(/<[^>]*>?/gm, '').substring(0, 250),
        reqContent: (j.requirements || '').replace(/<[^>]*>?/gm, '').substring(0, 200),
        descLength: (j.description || '').length,
        daysAgo: Math.floor(
          (Date.now() - new Date(j.createdAt).getTime()) / 86400000,
        ),
      }));

      const jdPrompt = `Bạn là một Chuyên gia phân tích dữ liệu tuyển dụng và Tư vấn HR cấp cao (Senior Talent Acquisition Advisor). Nhiệm vụ của bạn là tư vấn đánh giá CHẤT LƯỢNG NỘI DUNG của các bản tin tuyển dụng (Job Description - JD) và đưa ra lời khuyên sửa đổi mang tính thực chiến cao định hướng giúp công ty tuyển được người giỏi.
DỮ LIỆU CÁC JD CẦN PHÂN TÍCH: 
${JSON.stringify(unanalyzedSummary)}

Hãy phân tích ngầm trong đầu (Chain-of-Thought) với tiêu chuẩn khắt khe:
1. Độ rõ ràng & Mức lương: JD có nêu rõ khoảng lương (hasSalary=true) không? Nếu JD giấu lương -> rớt thảm hại về điểm hấp dẫn.
2. Độ chi tiết: Mô tả công việc (descriptionContent) và yêu cầu (reqContent) có bị rập khuôn sơ sài (chiều dài descLength quá ngắn) hay vay mượn từ điển IT? 
3. Tương tác chuyển đổi: Nếu thu hút lợt xem (views cao) mà cực ít người nộp đơn (applicants thấp) -> Nghĩa là Job thiếu chân thực, yêu cầu quá tham lam hoặc lương thấp. Nếu cả views và apply đều thấp -> Bị chìm nghỉm vô hình, yêu cầu làm lại nội dung tiêu đề và gắn badge nổi bật.

TRẢ VỀ DUY NHẤT 1 CHUỖI JSON THEO KHUÔN ĐỊNH DẠNG SAU:
{
  "jdScores": [
    {
      "id": "ID của JD", 
      "title": "Tên JD", 
      "score": <ĐIỂM SỐ NGHIÊM NGẶT TỪ 0-100. BẮT BUỘC NHƯ SAU: Nếu JD thiếu lương, mô tả quá ngắn hoặc quá hời hợt -> Đánh trượt không thương tiếc (chỉ cho 30-50 điểm). Chỉ khi nào JD cực kì chi tiết và rõ ràng -> Mới cho >80 điểm>, 
      "trend": "up" | "down" | "stable", 

      "reason": "<Đánh giá khái quát tối đa 60 ký tự. VD: Thiếu mức lương minh bạch; Mô tả yêu cầu rập khuôn>", 
      "weaknesses": [
        "<1-3 điểm nghẽn ngắn gọn (tối đa 5-7 chữ/từ) để dán nhãn UI. VD: Ẩn mức lương; Mô tả sơ sài>"
      ],
      "strengths": [
        "<1-2 điểm sáng ngắn gọn (tối đa 5-7 chữ/từ) để dán nhãn UI. VD: Lộ trình rõ ràng; Thời gian linh hoạt>"
      ],
      "detailedAdvice": [
        "<BẮT BUỘC CÓ: 1-3 lời khuyên phân tích sâu sắc, độ dài từ 15-40 chữ/câu, mang tính chuyên gia và hướng dẫn cách sửa chi tiết từng đoạn nhỏ trong JD để thu hút ứng viên>"
      ]
    }
  ]
}

LƯU Ý QUAN TRỌNG: SỬ DỤNG 100% TIẾNG VIỆT CHÍNH TẢ CHUẨN MỰC, TUYỆT ĐỐI KHÔNG SỬ DỤNG TIẾNG TRUNG/TIẾNG NHẬT. VĂN PHONG PHẢI NGHIÊM TÚC, SẮC BÉN VÀ ĐẬM CHẤT CHUYÊN GIA HR TƯ VẤN DOANH NGHIỆP.`;

      let success = false;
      // Priority 1: Groq
      if (process.env.GROQ_API_KEY) {
        try {
          const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: 'You are an HR AI Assistant. Always return JSON.' }, { role: 'user', content: jdPrompt }],
            temperature: 0.1,
            max_tokens: 8000,
            response_format: { type: "json_object" }
          }, {
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
          });
          const raw = groqRes.data.choices[0].message.content;
          const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/gi, '').trim());

          if (parsed.jdScores) {
            for (const scoreObj of parsed.jdScores) {
              const jobData = jobsNeedingAnalysis.find((j) => j.jobPostingId === scoreObj.id);
              if (jobData) {
                const hasSalary = !!(jobData.salaryMin || jobData.salaryMax);
                const descLength = (jobData.description || '').length;
                if (!hasSalary && scoreObj.score > 60) scoreObj.score -= 30;
                if (descLength < 400 && scoreObj.score > 60) scoreObj.score -= 20;
                scoreObj.score = Math.max(0, Math.min(100, scoreObj.score));

                const struct = jobData.structuredRequirements || {};
                finalJdScores.push({ ...scoreObj, autoFixedByAI: struct.autoFixedByAI });
                struct.aiAnalysis = { ...scoreObj, analyzedAt: new Date().toISOString(), version: 15 };
                await this.prisma.jobPosting.update({
                  where: { jobPostingId: scoreObj.id },
                  data: { structuredRequirements: struct },
                });
              }
            }
          }
          this.logger.log(`[AiInsightsService] Analyzed ${jobsNeedingAnalysis.length} missing JDs with Groq`);
          success = true;
        } catch (e: any) {
          this.logger.warn(`Missing JD Analysis failed with Groq: ${e.message}`);
        }
      }

      // Priority 2: Gemini Fallback
      if (!success) {
        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b'];
        for (const modelName of modelsToTry) {
          try {
            const model = this.genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json", maxOutputTokens: 8192 } });
            const result = await model.generateContent(jdPrompt);
            const raw = result.response
              .text()
              .replace(/```json/gi, '')
              .replace(/```/gi, '')
              .trim();
            const parsed = JSON.parse(raw);

            if (parsed.jdScores) {
              for (const scoreObj of parsed.jdScores) {
                const jobData = jobsNeedingAnalysis.find(
                  (j) => j.jobPostingId === scoreObj.id,
                );
                if (jobData) {
                  const hasSalary = !!(jobData.salaryMin || jobData.salaryMax);
                  const descLength = (jobData.description || '').length;
                  if (!hasSalary && scoreObj.score > 60) scoreObj.score -= 30;
                  if (descLength < 400 && scoreObj.score > 60) scoreObj.score -= 20;
                  scoreObj.score = Math.max(0, Math.min(100, scoreObj.score));

                  const struct = jobData.structuredRequirements || {};
                  finalJdScores.push({ ...scoreObj, autoFixedByAI: struct.autoFixedByAI });
                  struct.aiAnalysis = {
                    ...scoreObj,
                    analyzedAt: new Date().toISOString(),
                    version: 15,
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
        const daysAgoJob = Math.floor(
          (Date.now() - new Date(job.createdAt).getTime()) / 86400000,
        );
        if (daysAgoJob < 7) score += 15;
        if (job.status === 'APPROVED') score += 20;
        score = Math.min(score, 100);

        const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
        const trend = daysAgo < 3 ? 'up' : daysAgo > 14 ? 'down' : 'stable';
        const weaknesses: string[] = [];
        const strengths: string[] = [];
        const detailedAdvice: string[] = [];

        if (!hasSalary) {
          weaknesses.push('Thiếu mức lương cụ thể');
          detailedAdvice.push('Cần bổ sung mức lương tối thiểu và tối đa để tăng ngay lập tức lòng tin từ ứng viên. Khảo sát cho thấy 70% gen Z sẽ lướt qua tin giấu lương dù lộ trình hấp dẫn.');
        } else {
          strengths.push('Có mức lương rõ ràng');
        }

        if (descLength < 300) {
          weaknesses.push('Mô tả việc làm quá ngắn');
          detailedAdvice.push('Mô tả công việc cực kỳ sơ sài khiến ứng viên không hình dung được họ sẽ phải làm gì. Bạn cần liệt kê cụ thể ít nhất 4-5 gạch đầu dòng về công việc hằng ngày.');
        } else if (descLength >= 400 && descLength <= 800) {
          strengths.push('Mô tả chi tiết chuẩn SEO');
        }

        if (score < 60 && detailedAdvice.length === 0) {
           detailedAdvice.push('Nội dung yêu cầu ứng viên còn thiếu vắng kỹ năng thiết yếu. Cần bổ sung rõ kỹ năng cứng/mềm hoặc các loại bằng cấp tối thiểu để bộ lọc Matching làm việc hiệu quả hơn.');
        }
        if (views > 0 && applicants / views > 0.05)
          strengths.push('Tỉ lệ chuyển đổi ấn tượng');

        finalJdScores.push({
          id: job.jobPostingId,
          title: job.title,
          score,
          trend,
          reason: hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu thông tin quan trọng',
          weaknesses,
          strengths,
          detailedAdvice,
          autoFixedByAI: (job.structuredRequirements as any)?.autoFixedByAI,
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

    this.logger.log(`[AiInsightsService] activeJobs: ${activeJobs.length}, finalJdScores: ${finalJdScores.length}`);

    const prompt = `Bạn là chuyên gia tư vấn tuyển dụng AI. Phân tích dữ liệu thực tế sau và trả về JSON thuần Insights tổng quan thống kê (không backtick):

DỮ LIỆU:
- Tổng lượt xem: ${totalViews} | Ứng viên nộp: ${totalApplicants} | Tỉ lệ: ${avgApplyRate}%
- Tình trạng các JD: ${JSON.stringify(finalJdScores.map((s) => ({ id: s.id, title: s.title, score: s.score, weaknesses: s.weaknesses })))}

Trả về JSON:
{"insights":[{"type":"warning|tip|success","title":"<=60 ký tự","desc":"<=150 ký tự gợi ý hành động","priority":"high|medium|low","jobIds":["<Mảng chứa các id của JD bị ảnh hưởng. Truy cập trường id trong JSON đầu vào>"]}],"summary":"1-2 câu tổng quan thống kê chung"}
Tối đa 3 insights hành động. Mảng jobIds phải chính xác lấy theo id được cung cấp!`;

    // 🥇 Priority 1: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an HR AI Assistant. Always return JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        const raw = groqRes.data.choices[0].message.content;
        const parsed = JSON.parse(raw.replace(/```json/gi, '').replace(/```/gi, '').trim());

        const payload = {
          insights: parsed.insights || [],
          jdScores: finalJdScores || [],
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

        this.logger.log(`[AiInsightsService] AI insights generated with Groq and cached.`);
        return payload;
      } catch (e: any) {
        this.logger.warn(`[AiInsightsService] Groq recruiterInsights failed: ${e.message}`);
      }
    }

    // 🥈 Priority 2: Gemini
    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-8b',
    ];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
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

    this.logger.log(`[AiInsightsService] Fallback activeJobs: ${activeJobs.length}, ruleJdScores: ${ruleJdScores.length}`);

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
      .catch(() => { });

    return fallbackPayload;
  }
}

