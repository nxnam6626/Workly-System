import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class RecruiterJdAnalysisService {
  private readonly logger = new Logger(RecruiterJdAnalysisService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.GEMINI_API_KEY;
    if (key) this.genAI = new GoogleGenerativeAI(key);
  }

  async analyzeMissingJds(activeJobs: any[], finalJdScores: any[]) {
    const jobsNeedingAnalysis: any[] = [];

    for (const job of activeJobs) {
      const struct = (job.structuredRequirements as any) || {};
      const aiAnalysis = struct.aiAnalysis;

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

    if (jobsNeedingAnalysis.length > 0) {
      await this.runLlmAnalysis(jobsNeedingAnalysis, finalJdScores);
    }

    // Rule-based fallback for any still missing
    for (const job of activeJobs) {
      if (!finalJdScores.find((s) => s.id === job.jobPostingId)) {
        finalJdScores.push(this.calculateRuleBasedScore(job));
      }
    }
  }

  private calculateRuleBasedScore(job: any) {
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
    
    const daysAgoJob = Math.floor((Date.now() - new Date(job.createdAt).getTime()) / 86400000);
    if (daysAgoJob < 7) score += 15;
    if (job.status === 'APPROVED') score += 20;
    
    const trend = daysAgoJob < 3 ? 'up' : daysAgoJob > 14 ? 'down' : 'stable';
    const weaknesses: string[] = [];
    const strengths: string[] = [];
    const detailedAdvice: string[] = [];

    if (!hasSalary) {
      weaknesses.push('Thiếu mức lương cụ thể');
      detailedAdvice.push('Cần bổ sung mức lương tối thiểu và tối đa để tăng ngay lập tức lòng tin từ ứng viên.');
    } else {
      strengths.push('Có mức lương rõ ràng');
    }

    if (descLength < 300) {
      weaknesses.push('Mô tả việc làm quá ngắn');
      detailedAdvice.push('Mô tả công việc cực kỳ sơ sài khiến ứng viên không hình dung được họ sẽ phải làm gì.');
    } else if (descLength >= 400 && descLength <= 800) {
      strengths.push('Mô tả chi tiết chuẩn SEO');
    }

    return {
      id: job.jobPostingId,
      title: job.title,
      score: Math.min(score, 100),
      trend,
      reason: hasSalary ? 'Có mức lương rõ ràng' : 'Thiếu thông tin quan trọng',
      weaknesses,
      strengths,
      detailedAdvice,
      autoFixedByAI: (job.structuredRequirements as any)?.autoFixedByAI,
    };
  }

  private async runLlmAnalysis(jobs: any[], finalJdScores: any[]) {
    const summary = jobs.map((j) => ({
      id: j.jobPostingId,
      title: j.title,
      views: j.viewCount || 0,
      applicants: j._count.applications,
      hasSalary: !!(j.salaryMin || j.salaryMax),
      descriptionContent: (j.description || '').replace(/<[^>]*>?/gm, '').substring(0, 250),
      reqContent: (j.requirements || '').replace(/<[^>]*>?/gm, '').substring(0, 200),
      descLength: (j.description || '').length,
      daysAgo: Math.floor((Date.now() - new Date(j.createdAt).getTime()) / 86400000),
    }));

    const jdPrompt = `Bạn là chuyên gia phân tích JD. Phân tích dữ liệu: ${JSON.stringify(summary)}. Trả về JSON: {"jdScores": [{"id": "...", "score": 0-100, "trend": "up|down|stable", "reason": "...", "weaknesses": [], "strengths": [], "detailedAdvice": []}]}`;

    let success = false;
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an HR AI Assistant. Always return JSON.' }, { role: 'user', content: jdPrompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        const parsed = JSON.parse(groqRes.data.choices[0].message.content.replace(/```json|```/gi, '').trim());
        await this.processLlmResult(parsed, jobs, finalJdScores);
        success = true;
      } catch (e) {
        this.logger.warn(`Groq JD Analysis failed: ${e.message}`);
      }
    }

    if (!success && this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(jdPrompt);
        const parsed = JSON.parse(result.response.text().replace(/```json|```/gi, '').trim());
        await this.processLlmResult(parsed, jobs, finalJdScores);
      } catch (e) {
        this.logger.error(`Gemini JD Analysis failed: ${e.message}`);
      }
    }
  }

  private async processLlmResult(parsed: any, originalJobs: any[], finalJdScores: any[]) {
    if (!parsed.jdScores) return;
    for (const scoreObj of parsed.jdScores) {
      const jobData = originalJobs.find((j) => j.jobPostingId === scoreObj.id);
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
}
