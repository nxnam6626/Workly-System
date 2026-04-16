import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

import { SearchService } from '../search/search.service';

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;

  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly prisma: PrismaService,
  ) {
    require('dotenv').config({ override: true });
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

      if (!this.isConfigured) return '';

      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy, không thêm lời chào, bình luận hay định dạng markdown không cần thiết.',
            { inlineData: { data: dataBuffer.toString('base64'), mimeType: 'application/pdf' } }
          ]);
          return result.response.text().trim();
        } catch (innerError: any) {
          console.warn(`[AiService] Local PDF extraction failed with ${modelName}. Trying next...`);
          await SLEEP(500);
        }
      }
      throw new Error('All Gemini models failed for local PDF extraction');
    } catch (e: any) {
      console.error('Error parsing local PDF with Gemini:', e.message);
      return '';
    }
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      const dataBuffer = Buffer.from(response.data);

      if (!this.isConfigured) return '';

      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            'Trích xuất toàn bộ văn bản (text) từ file PDF này một cách rõ ràng và chính xác. Trả về nội dung thuần túy, không thêm lời chào, bình luận hay định dạng markdown không cần thiết.',
            { inlineData: { data: dataBuffer.toString('base64'), mimeType: 'application/pdf' } }
          ]);
          return result.response.text().trim();
        } catch (innerError: any) {
          console.warn(`[AiService] URL PDF extraction failed with ${modelName}. Trying next...`);
          await SLEEP(500);
        }
      }
      throw new Error('All Gemini models failed for URL PDF extraction');
    } catch (e: any) {
      console.error('Error fetching/parsing PDF with Gemini:', e.message);
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

    const prompt = `You are a strict HR AI Assistant. Evaluate the candidate's CV against the Job Title and Job Requirements.
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}
      Candidate CV Text: ${cvText.substring(0, 15000)}
      
      Evaluate their relevant skills, experience years, and degree.
      Return ONLY a JSON response in the following format (no markdown, no backticks, no extra text):
      {"score": 85}
      
      Score should be an integer from 10 to 99 based on how well the CV matches the specific requirements. Unrelated CVs should score low (10-30).`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanResponse = responseText
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          .trim();
        const parsed = JSON.parse(cleanResponse);
        const score = Number(parsed.score);

        return isNaN(score) ? 50 : score;
      } catch (e: any) {
        console.warn(`[AiService] evaluateMatch error with ${modelName}. Trying next...`);
        await SLEEP(500);
      }
    }
    console.error('AI Match Error: All models failed.');
    return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1)); // Fallback
  }

  async extractFocusSkills(jobTitle: string, jobRequirements: string): Promise<string[]> {
    if (!this.isConfigured) return [];
    const prompt = `Extract exactly 3 core "Focus Skills" (Kỹ năng trọng tâm) for the following job in Vietnamese. Return ONLY a JSON array of strings. Example: ["ReactJS", "NodeJS", "TypeScript"].
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanResponse = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(cleanResponse);
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
        return [];
      } catch (e: any) {
        console.warn(`[AiService] extractFocusSkills error with ${modelName}. Trying next...`);
        await SLEEP(500);
      }
    }
    console.error('AI Focus Skills Error: All models failed.');
    return [];
  }

  async expandJobKeywords(jobTitle: string, hardSkills: string[]): Promise<Record<string, string[]>> {
    if (!this.isConfigured || hardSkills.length === 0) return {};

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];

    for (let i = 0; i < modelsToTry.length; i++) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelsToTry[i] });
        const prompt = `You are an expert IT Technical Recruiter. Based on the job title "${jobTitle}" and the following required hard skills: ${JSON.stringify(hardSkills)}.
        For each skill, generate an array of up to 5 strictly related synonyms, exact frameworks, or alternative terms that candidates commonly write in CVs.
        Return ONLY a JSON object where the keys are the original skills from the list, and the values are arrays of string synonyms.
        Do not use markdown, backticks or explanations.
        Example: {"ReactJS": ["React", "React.js", "Redux", "Hooks"], "Node.js": ["Node", "NodeJS", "Express"]}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        return JSON.parse(text);
      } catch (e: any) {
        if ((e.message?.includes('503') || e.message?.includes('429')) && i < modelsToTry.length - 1) {
          console.warn(`[AiService] expandJobKeywords error with ${modelsToTry[i]} (${e.message}). Switching to fallback ${modelsToTry[i + 1]}...`);
          // wait 500ms before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        console.error('AI expandJobKeywords error:', e.message);
        return {};
      }
    }
    return {};
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
    const activeJobs = allJobs.filter(j => j.status === 'APPROVED');
    const totalViews = activeJobs.reduce((sum, j) => sum + (j.viewCount || 0), 0);
    const totalApplicants = activeJobs.reduce((sum, j) => sum + j._count.applications, 0);
    const avgApplyRate = totalViews > 0 ? ((totalApplicants / totalViews) * 100).toFixed(1) : '0';

    // 2. Compute cache key from actual data fingerprint
    const latestUpdate = allJobs[0]?.updatedAt?.getTime() ?? 0;
    const cacheKey = `${allJobs.length}:${latestUpdate}:${totalViews}:${totalApplicants}_v7`;

    const cachedPayload = recruiter.aiInsightsCache as any;

    // 3. Return full cache if overall data signature unchanged
    if (recruiter.aiInsightsCacheKey === cacheKey && cachedPayload) {
      this.logger.log(`[AiService] Returning cached AI insights for recruiter ${recruiter.recruiterId}`);
      return cachedPayload;
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
      if (aiAnalysis && aiAnalysis.score !== undefined && new Date(aiAnalysis.analyzedAt) >= job.updatedAt) {
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
        daysAgo: Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000),
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
          const raw = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
          const parsed = JSON.parse(raw);

          if (parsed.jdScores) {
            for (const scoreObj of parsed.jdScores) {
              finalJdScores.push(scoreObj);
              // Lưu cache ngược lại DB theo từng JD
              const jobData = jobsNeedingAnalysis.find((j) => j.jobPostingId === scoreObj.id);
              if (jobData) {
                const struct = (jobData.structuredRequirements as any) || {};
                struct.aiAnalysis = { ...scoreObj, analyzedAt: new Date().toISOString() };
                await this.prisma.jobPosting.update({
                  where: { jobPostingId: scoreObj.id },
                  data: { structuredRequirements: struct },
                });
              }
            }
          }
          this.logger.log(`[AiService] Analyzed ${jobsNeedingAnalysis.length} missing JDs with ${modelName}`);
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
        const daysAgo = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
        if (daysAgo < 7) score += 15;
        if (job.status === 'APPROVED') score += 20;

        const trend = daysAgo < 3 ? 'up' : daysAgo > 14 ? 'down' : 'stable';
        const weaknesses: string[] = [];
        const strengths: string[] = [];
        if (!hasSalary) weaknesses.push('Thiếu mức lương cụ thể');
        else strengths.push('Có mức lương rõ ràng');
        if (descLength < 300) weaknesses.push('Mô tả việc làm quá ngắn');
        else if (descLength >= 400 && descLength <= 800) strengths.push('Mô tả chi tiết chuẩn SEO');
        if (views > 0 && applicants / views > 0.05) strengths.push('Tỉ lệ chuyển đổi ấn tượng');

        finalJdScores.push({
          id: job.jobPostingId,
          title: job.title,
          score: Math.min(score, 100),
          trend,
          reason: hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu mức lương',
          weaknesses,
          strengths
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
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash-8b'];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
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
          data: { aiInsightsCache: payload as any, aiInsightsCacheKey: cacheKey, aiInsightsCachedAt: new Date() },
        });

        this.logger.log(`[AiService] AI insights generated with ${modelName} and cached.`);
        return payload;
      } catch (e: any) {
        this.logger.warn(`[AiService] recruiterInsights failed with ${modelName}: ${e.message?.substring(0, 120)}`);
        await SLEEP(1000);
      }
    }

    // 6. Rule-based fallback — use jobRefs [{id, title}] instead of just IDs
    this.logger.warn('[AiService] All Gemini models failed. Running rule-based fallback analysis.');

    const jobSummary = jobsForAnalysis.map((j: any) => ({
      id: j.jobPostingId,
      title: j.title,
      status: j.status,
      views: j.viewCount || 0,
      applicants: j._count.applications,
      hasSalary: !!(j.salaryMin || j.salaryMax),
      descLength: (j.description || '').length,
      daysAgo: Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000),
    }));

    const ruleInsights: any[] = [];
    const ruleJdScores = jobSummary
      .filter((j: any) => j.status === 'APPROVED')  // chỉ lấy tin đang chạy
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

        if (j.descLength < 300) fallbackWeaknesses.push('Mô tả việc làm quá ngắn');
        else if (j.descLength >= 400 && j.descLength <= 800) fallbackStrengths.push('Mô tả chi tiết chuẩn SEO');

        if (j.views > 0 && j.applicants / j.views > 0.05) fallbackStrengths.push('Tỉ lệ chuyển đổi ứng viên rất tốt');

        return { id: j.id, title: j.title, score: Math.min(score, 100), trend, reason: j.hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu mức lương', weaknesses: fallbackWeaknesses, strengths: fallbackStrengths };
      });

    const noSalaryJobs = jobSummary.filter((j: any) => !j.hasSalary);
    if (noSalaryJobs.length > 0) {
      ruleInsights.push({
        type: 'warning',
        title: `${noSalaryJobs.length} JD chưa khai báo mức lương`,
        desc: `Bổ sung mức lương cho ${noSalaryJobs.map((j: any) => j.title).slice(0, 2).join(', ')} để tăng ~35% lượt apply.`,
        priority: 'high',
        jobRefs: noSalaryJobs.map((j: any) => ({ id: j.id, title: j.title })).filter((r: any) => r.id),
      });
    }
    const shortDescJobs = jobSummary.filter((j: any) => j.descLength < 300 && j.descLength > 0);
    if (shortDescJobs.length > 0) {
      ruleInsights.push({
        type: 'tip',
        title: 'Mô tả JD quá ngắn, cần bổ sung thêm',
        desc: `${shortDescJobs.length} JD có mô tả dưới 300 ký tự. Mô tả chi tiết 500-800 ký tự đạt hiệu quả cao nhất.`,
        priority: 'medium',
        jobRefs: shortDescJobs.map((j: any) => ({ id: j.id, title: j.title })).filter((r: any) => r.id),
      });
    }
    const lowApplyRate = parseFloat(avgApplyRate) < 3 && totalViews > 10;
    if (lowApplyRate) {
      ruleInsights.push({ type: 'tip', title: 'Tỉ lệ apply/view thấp hơn ngưỡng tốt', desc: `Tỉ lệ ${avgApplyRate}% thấp hơn chuẩn 5%. Xem xét cải thiện tiêu đề JD và thêm quyền lợi hấp dẫn.`, priority: 'medium' });
    }
    if (activeJobs.length > 0 && ruleInsights.length === 0) {
      ruleInsights.push({ type: 'success', title: 'Tài khoản hoạt động ổn định', desc: `Bạn có ${activeJobs.length} tin đang mở với tổng ${totalApplicants} ứng viên. Tiếp tục duy trì để tối ưu kết quả tuyển dụng.`, priority: 'low' });
    }

    const summaryText = activeJobs.length === 0
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

    await this.prisma.recruiter.update({
      where: { recruiterId: recruiter.recruiterId },
      data: { aiInsightsCache: fallbackPayload as any, aiInsightsCacheKey: cacheKey, aiInsightsCachedAt: new Date() },
    }).catch(() => { });

    return fallbackPayload;
  }

  // =====================================================
  // AI CONTENT MODERATION
  // =====================================================

  /**
   * Kiểm duyệt nội dung JD bằng Gemini thật.
   * Trả về score 0-100 và danh sách flags vi phạm.
   * Fallback về score random 70-95 nếu AI bị giới hạn.
   */
  async moderateJobContent(
    title: string,
    description: string,
    requirements?: string,
    benefits?: string,
    hardSkills?: string[],
  ): Promise<{ score: number; safe: boolean; flags: string[]; reason: string; usedAI: boolean }> {
    if (!this.isConfigured) {
      const score = parseFloat((Math.random() * (95 - 70) + 70).toFixed(1));
      return { score, safe: true, flags: [], reason: 'AI not configured, fallback score.', usedAI: false };
    }

    const prompt = `Bạn là hệ thống kiểm duyệt nội dung tuyển dụng. Phân tích JD sau và trả về JSON thuần (không markdown):

TIÊU ĐỀ: ${title}
MÔ TẢ: ${description?.substring(0, 800) || ''}
YÊU CẦU: ${requirements?.substring(0, 500) || ''}
QUYỀN LỢI: ${benefits?.substring(0, 300) || ''}
KỸ NĂNG: ${(hardSkills || []).join(', ')}

Kiểm tra các vấn đề sau:
- Vi phạm pháp luật (lừa đảo, tuyển mại dâm, lao động bất hợp pháp)
- Nội dung phân biệt đối xử (giới tính, tôn giáo, dân tộc, tuổi tác bất hợp lý)
- Thông tin sai lệch rõ ràng (mức lương phi thực tế, bằng cấp giả)
- Nội dung spam hoặc quảng cáo không liên quan

Trả về JSON: {"score":0-100,"safe":true,"flags":["mô tả vi phạm nếu có"],"reason":"tóm tắt ngắn"}
Quy tắc score: 100=hoàn hảo, 70-99=ổn, 50-69=cần xem lại, <50=vi phạm. Safe=false nếu score<50.`;

    const modelsToTry = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];
    for (const modelName of modelsToTry) {
      try {
        const model = this.genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const raw = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
        const parsed = JSON.parse(raw);
        this.logger.log(`[AiService] moderateJobContent: score=${parsed.score}, safe=${parsed.safe} (${modelName})`);
        return {
          score: Math.min(100, Math.max(0, Number(parsed.score) || 70)),
          safe: parsed.safe !== false,
          flags: Array.isArray(parsed.flags) ? parsed.flags : [],
          reason: parsed.reason || '',
          usedAI: true,
        };
      } catch (e: any) {
        this.logger.warn(`[AiService] moderateJobContent failed with ${modelName}: ${e.message?.substring(0, 80)}`);
        await SLEEP(800);
      }
    }

    // Fallback nếu tất cả AI fail (quota, outage...)
    const fallbackScore = parseFloat((Math.random() * (95 - 70) + 70).toFixed(1));
    this.logger.warn(`[AiService] moderateJobContent: All models failed, fallback score ${fallbackScore}`);
    return { score: fallbackScore, safe: true, flags: [], reason: 'AI unavailable, fallback score.', usedAI: false };
  }

  /**
   * Kiểm duyệt ảnh bằng Gemini Vision.
   * imageInput: URL public hoặc base64 string.
   * Fail-open: nếu AI fail thì cho ảnh qua (tránh block upload hợp lệ).
   */
  async moderateImage(
    imageInput: string,
    mimeType: string = 'image/jpeg',
    expectedType: 'face_only' | 'face_or_logo' | 'any' = 'face_or_logo',
  ): Promise<{ safe: boolean; reason: string; usedAI: boolean }> {
    if (!this.isConfigured) return { safe: true, reason: 'AI not configured.', usedAI: false };

    try {
      let imageData: string;

      if (imageInput.startsWith('http')) {
        const response = await axios.get(imageInput, { responseType: 'arraybuffer', timeout: 8000 });
        imageData = Buffer.from(response.data).toString('base64');
        const ct = response.headers['content-type'];
        if (ct) mimeType = ct.split(';')[0];
      } else {
        imageData = imageInput.replace(/^data:[^;]+;base64,/, '');
      }

      let ruleText = 'Lưu ý: ảnh đại diện cá nhân chuyên nghiệp, logo công ty đều là HỢP LỆ.';
      if (expectedType === 'face_only') {
        ruleText = 'RẤT QUAN TRỌNG: Đây là ảnh đại diện của Ứng viên xin việc. Bắt buộc MỘT TRONG HAI yêu cầu: (a) Phải có KHUÔN MẶT NGƯỜI rõ ràng. Hoặc (b) nếu không có khuôn mặt thì phải là một bức ảnh rất trang trọng/lịch sự để xin việc. NẾU là ảnh động vật, phong cảnh, ảnh troll, ảnh anime khiêu khích... KHÔNG CÓ MẶT NGƯỜI -> đánh dấu là KHÔNG AN TOÀN (safe: false) và ghi reason "Ảnh đại diện ứng viên nên có khuôn mặt hoặc là ảnh lịch sự!".';
      } else if (expectedType === 'face_or_logo') {
        ruleText = 'Lưu ý: ảnh đại diện cá nhân chuyên nghiệp, khuông mặt người, logo công ty, logo doanh nghiệp đều là HỢP LỆ.';
      }

      const modelsToTry = ['gemini-2.0-flash', 'gemini-2.5-flash'];
      for (const modelName of modelsToTry) {
        try {
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent([
            { inlineData: { data: imageData, mimeType: mimeType as any } },
            `Bạn là hệ thống kiểm duyệt ảnh cho nền tảng tuyển dụng. Phân tích ảnh và trả về JSON thuần:
Kiểm tra: (1) Ảnh khiêu dâm/bạo lực, (2) nội dung thù địch/phân biệt chủng tộc, (3) nội dung không phù hợp với môi trường công sở.
${ruleText}
Trả về đúng định dạng JSON: {"safe":true|false,"reason":"mô tả nếu không an toàn, hoặc OK nếu an toàn"}`,
          ]);
          const raw = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
          const parsed = JSON.parse(raw);
          this.logger.log(`[AiService] moderateImage: safe=${parsed.safe} via ${modelName}`);
          return { safe: parsed.safe !== false, reason: parsed.reason || 'OK', usedAI: true };
        } catch (e: any) {
          this.logger.warn(`[AiService] moderateImage failed with ${modelName}: ${e.message?.substring(0, 80)}`);
          await SLEEP(500);
        }
      }
    } catch (e: any) {
      this.logger.warn(`[AiService] moderateImage fetch error: ${e.message}`);
    }

    return { safe: true, reason: 'AI unavailable, image allowed by default.', usedAI: false };
  }

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured) return 'AI is not configured.';

    const normalizedQuery = message.trim().toLowerCase();

    // 1. Kiểm tra cache câu hỏi để tiết kiệm Token
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({
        where: { query: normalizedQuery }
      });
      if (cached) {
        this.logger.log(`[AiService] Cache hit for query: "${normalizedQuery.substring(0, 50)}..."`);
        return cached.response;
      }
    } catch (e) {
      this.logger.warn(`Failed to read from AI Query cache: ${e}`);
    }

    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
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
              response: responseText
            }
          });
        } catch (e) {
          // Bỏ qua lỗi duplicate nếu bị gửi đồng thời
        }

        return responseText;
      } catch (e: any) {
        console.warn(`[AiService] generateResponse error with ${modelName}. Trying next...`);
        await SLEEP(500);
      }
    }
    console.error('generateResponse error: All models failed.');
    return 'Error generating response';
  }


}
