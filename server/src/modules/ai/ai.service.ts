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
          console.warn(`[AiService] expandJobKeywords error with ${modelsToTry[i]} (${e.message}). Switching to fallback ${modelsToTry[i+1]}...`);
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
    }).catch(() => {});

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
    } catch(e) {
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
        } catch(e) {
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
    } catch (e) {
      this.logger.error(`Lỗi khi lấy Candidate Context: ${e.message}`);
      return '';
    }
  }

  async expandSearchQuery(message: string): Promise<string[]> {
    if (!this.isConfigured) return [];
    
    // Thử với danh sách model ưu tiên
    const models = ['gemini-flash-latest', 'gemini-2.0-flash'];
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
        this.logger.warn(`Model ${modelId} lỗi (${error.status || 'unknown'}). Thử model tiếp theo...`);
        await SLEEP(500);
      }
    }

    this.logger.error(`Tất cả model expandSearchQuery đều lỗi: ${lastError?.message}`);
    return [];
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

    // 1. FAST PATH INTERCEPTION: CV Matching Intent
    // If user explicitly asks for jobs matching their CV, we fetch from JobMatch DB (no tokens sent)
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
            yield '__ACTION__:' + JSON.stringify({ type: 'SHOW_JOB_CARDS', payload });
            return;
          }
        }
      } catch (err) {
        this.logger.warn(`Fast path JobMatch error: ${err}`);
      }
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
      } catch (e) { this.logger.warn(`Fast path Applications error ${e}`) }
    }

    // 1(c). FAST PATH: Recruiter's wallet
    if (isRecruiter && context?.userId && (normalizedMsg.includes('số dư xu') || normalizedMsg.includes('ví của tôi') || normalizedMsg.includes('còn bao nhiêu xu') || normalizedMsg.includes('tài khoản của tôi'))) {
      try {
        const recruiterRecord = await this.prisma.recruiter.findUnique({
          where: { userId: context.userId },
          include: { recruiterWallet: true }
        });
        if (recruiterRecord?.recruiterWallet) {
           yield `Tài khoản ví của bạn hiện đang có: **${new Intl.NumberFormat('vi-VN').format(recruiterRecord.recruiterWallet.balance)} Xu**.\nSố lượt mở khóa CV hiện còn: **${recruiterRecord.recruiterWallet.cvUnlockQuota}** lượt.`;
           return;
        }
      } catch(e) { this.logger.warn(`Fast path Wallet error ${e}`) }
    }

    // 1(d). FAST PATH: Recruiter's active jobs
    if (isRecruiter && context?.userId && (normalizedMsg.includes('tin tuyển dụng đã đăng') || normalizedMsg.includes('danh sách việc làm') || normalizedMsg.includes('thống kê tin tuyển dụng'))) {
      try {
         const recruiterRecord = await this.prisma.recruiter.findUnique({ where: { userId: context.userId } });
         if (recruiterRecord) {
             const jobs = await this.prisma.jobPosting.findMany({
                where: { recruiterId: recruiterRecord.recruiterId },
                select: { status: true }
             });
             const active = jobs.filter(j => j.status === 'APPROVED').length;
             const pending = jobs.filter(j => j.status === 'PENDING').length;
             const expired = jobs.filter(j => j.status === 'EXPIRED').length;
             const rejected = jobs.filter(j => j.status === 'REJECTED').length;
             
             yield `Tổng quan tin tuyển dụng của công ty bạn:\n- Đang tuyển / Đã duyệt: **${active}**\n- Đang chờ duyệt: **${pending}**\n- Đã hết hạn: **${expired}**\n- Bị từ chối: **${rejected}**\n\nBạn có thể vào mục "Tin Tuyển Dụng" trên menu để xem và quản lý chi tiết.`;
             return;
         }
      } catch(e) {}
    }

    // 1(e). FAST PATH: Candidate's saved jobs
    if (isCandidate && context?.userId && (normalizedMsg.includes('công việc đã lưu') || normalizedMsg.includes('việc đã lưu') || normalizedMsg.includes('job đã lưu'))) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({ where: { userId: context.userId } });
        if (candidateRecord) {
           const savedJobs = await this.prisma.savedJob.findMany({
             where: { candidateId: candidateRecord.candidateId },
             include: { jobPosting: { include: { company: true } } },
             orderBy: { savedAt: 'desc' },
             take: 5
           });
           if (savedJobs.length > 0) {
             let response = 'Đây là danh sách 5 công việc bạn đã lưu gần nhất:\n\n';
             savedJobs.forEach(sj => {
               response += `- **${sj.jobPosting.title}** tại ${sj.jobPosting.company.companyName} (Lưu ngày: ${new Date(sj.savedAt).toLocaleDateString('vi-VN')})\n`;
             });
             yield response;
             return;
           } else {
             yield 'Bạn chưa lưu công việc nào vào danh sách yêu thích.';
             return;
           }
        }
      } catch(e) {}
    }

    // 1(f). FAST PATH: Candidate's profile info
    if (isCandidate && context?.userId && (normalizedMsg.includes('thông tin tài khoản') || normalizedMsg.includes('hồ sơ của tôi'))) {
      try {
        const candidateRecord = await this.prisma.candidate.findUnique({
          where: { userId: context.userId },
          include: { skills: true, user: true }
        });
        if (candidateRecord) {
           yield `Thông tin hồ sơ cơ bản của bạn:\n- **Họ tên**: ${candidateRecord.fullName}\n- **Email**: ${candidateRecord.user.email}\n- **Học vấn**: ${candidateRecord.university || 'Chưa cập nhật'}\n- **Điểm GPA**: ${candidateRecord.gpa || 'Chưa cập nhật'}\n- **Kỹ năng**: ${candidateRecord.skills.map((s: any) => s.skillName).join(', ') || 'Chưa cập nhật'}\n- **Tìm việc**: ${candidateRecord.isOpenToWork ? 'Đang bật' : 'Đang tắt'}\n\nBạn có thể vào mục "Hồ sơ cá nhân" để cập nhật chi tiết hơn.`;
           return;
        }
      } catch(e) {}
    }

    // 1(g). FAST PATH: Recruiter's applicants list
    if (isRecruiter && context?.userId && (normalizedMsg.includes('danh sách ứng viên') || normalizedMsg.includes('người đã nộp đơn') || normalizedMsg.includes('ứng viên ứng tuyển'))) {
      try {
         const recruiterRecord = await this.prisma.recruiter.findUnique({ where: { userId: context.userId } });
         if (recruiterRecord) {
             const applicants = await this.prisma.application.findMany({
               where: { jobPosting: { recruiterId: recruiterRecord.recruiterId } },
               include: { candidate: true, jobPosting: true },
               orderBy: { applyDate: 'desc' },
               take: 5
             });
             if (applicants.length > 0) {
               let response = 'Đây là 5 lượt ứng tuyển gửi đến công ty bạn gần nhất:\n\n';
               applicants.forEach(app => {
                 response += `- Ứng viên **${app.candidate.fullName}** ứng tuyển vị trí **${app.jobPosting.title}** (Ngày: ${new Date(app.applyDate).toLocaleDateString('vi-VN')})\n`;
               });
               yield response;
               return;
             } else {
               yield 'Hiện tại chưa có ứng viên nào nộp đơn vào các tin tuyển dụng của bạn.';
               return;
             }
         }
      } catch(e) {}
    }

    // 2. CHECK CACHE FOR SIMILAR QUESTIONS
    try {
      const cached = await this.prisma.aiQueryCache.findUnique({
        where: { query: normalizedMsg }
      });
      if (cached) {
        yield cached.response;
        return;
      }
    } catch(e) {}

    const models = ['gemini-flash-latest', 'gemini-2.0-flash'];
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

        // 2. Phân tích ý định tìm việc
        const userMessage = message.toLowerCase();
        const isJobSearch = [
          'tìm việc', 'kiếm việc', 'gợi ý việc', 'gợi ý công việc', 'gợi ý job', 
          'tìm job', 'có việc nào', 'có job nào', 'có công việc nào', 
          'việc làm phù hợp', 'công việc phù hợp', 'job phù hợp',
          'tìm kiếm việc', 'tìm kiếm job', 'danh sách việc làm', 'giới thiệu việc'
        ].some(phrase => userMessage.includes(phrase));

        if (isJobSearch) {
          const expandedKeywords = await this.expandSearchQuery(message);
          
          const jobs = await this.searchService.searchJobsForRAG({
            search: message,
            expandedKeywords: expandedKeywords,
            limit: 3,
          });

          if (jobs && jobs.length > 0) {
            ragContext += `\n--- DANH SÁCH VIỆC LÀM PHÙ HỢP (Market Data) ---\n${JSON.stringify(jobs)}\n`;
            yield '__ACTION__:' + JSON.stringify({ type: 'SHOW_JOB_CARDS', payload: jobs });
          }
        }

        // --- Build role-based system prompt ---
        let systemPrompt: string;

        if (isRecruiter) {
          systemPrompt = `Bạn là Workly-AI dành cho NHÀ TUYỂN DỤNG. Chỉ tư vấn các vấn đề tuyển dụng.

        NGỮ CẢNH DỮ LIỆU: ${ragContext || 'Chưa có dữ liệu công ty.'}

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
               data: { query: normalizedMsg, response: fullResponse }
             });
          }
        } catch(e) { }
        
        success = true; // Đã xong và thành công
      } catch (error: any) {
        lastError = error;
        this.logger.warn(`Model ${modelId} stream error: ${error.message}. Thử model tiếp theo...`);
        await SLEEP(500);
      }
    }

    if (!success) {
      this.logger.error(`RAG models failed, trying direct fallback models. Mssg: ${lastError?.message}`);
      
      const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-flash'];
      
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
              console.warn(`[AiService] Quota exceeded for ${modelsToTry[i]}. Switching to fallback ${modelsToTry[i+1]}...`);
              continue; // Fallback to next model
            }
            console.error(`[AiService] generateStreamResponse error with ${modelsToTry[i]}:`, e.message);
          }
      }
      
      // If all fallbacks also fail
      yield '\n[Hệ thống]: Hiện tại máy chủ trí tuệ nhân tạo đang rất bận (Quá tải). Bạn hãy thử lại sau ít phút hoặc nhấn Gửi lại nhé!';
    }
  }
}
