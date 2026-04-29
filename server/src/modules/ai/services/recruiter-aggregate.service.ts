import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

@Injectable()
export class RecruiterAggregateService {
  private readonly logger = new Logger(RecruiterAggregateService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.GEMINI_API_KEY;
    if (key) this.genAI = new GoogleGenerativeAI(key);
  }

  async generateAggregateInsights(recruiter: any, stats: any, finalJdScores: any[], cacheKey: string) {
    const prompt = `Bạn là chuyên gia tư vấn tuyển dụng AI. Phân tích dữ liệu:
    Stats: ${JSON.stringify(stats)}
    JD Scores: ${JSON.stringify(finalJdScores.map(s => ({ id: s.id, title: s.title, score: s.score, weaknesses: s.weaknesses })))}
    Trả về JSON: {"insights":[{"type":"warning|tip|success","title":"...","desc":"...","priority":"high|medium|low","jobIds":[]}], "summary":"..."}`;

    let parsedResult: any = null;

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
        parsedResult = JSON.parse(groqRes.data.choices[0].message.content.replace(/```json|```/gi, '').trim());
      } catch (e) {
        this.logger.warn(`Groq Aggregate Insights failed: ${e.message}`);
      }
    }

    if (!parsedResult && this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } });
        const result = await model.generateContent(prompt);
        parsedResult = JSON.parse(result.response.text().replace(/```json|```/gi, '').trim());
      } catch (e) {
        this.logger.error(`Gemini Aggregate Insights failed: ${e.message}`);
      }
    }

    if (!parsedResult) {
      parsedResult = this.generateRuleBasedAggregate(stats, finalJdScores);
    }

    const payload = {
      insights: parsedResult.insights || [],
      jdScores: finalJdScores,
      summary: parsedResult.summary || '',
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

    return payload;
  }

  private generateRuleBasedAggregate(stats: any, finalJdScores: any[]) {
    const insights: any[] = [];
    const lowScoreJobs = finalJdScores.filter(s => s.score < 60);
    
    if (lowScoreJobs.length > 0) {
      insights.push({
        type: 'warning',
        title: `${lowScoreJobs.length} tin tuyển dụng có điểm nội dung thấp`,
        desc: 'Hãy bổ sung mức lương và mô tả chi tiết hơn để thu hút ứng viên.',
        priority: 'high',
        jobIds: lowScoreJobs.map(j => j.id)
      });
    }

    if (stats.avgApplyRate < 3 && stats.totalViews > 20) {
      insights.push({
        type: 'tip',
        title: 'Tỷ lệ ứng tuyển đang thấp hơn trung bình',
        desc: 'Cân nhắc điều chỉnh tiêu đề và quyền lợi để tăng sức hấp dẫn.',
        priority: 'medium',
        jobIds: []
      });
    }

    return {
      insights: insights.slice(0, 3),
      summary: `Hiện tại bạn có ${stats.activeJobs} tin đang đăng tuyển với ${stats.totalApplicants} lượt ứng tuyển.`
    };
  }
}
