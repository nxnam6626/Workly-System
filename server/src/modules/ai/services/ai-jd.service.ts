import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AiChatService } from '../ai-chat.service';
import { AiModerationService } from '../ai-moderation.service';
import { Queue } from 'bullmq';
import axios from 'axios';

@Injectable()
export class AiJdService {
  private readonly logger = new Logger(AiJdService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiChatService: AiChatService,
    private readonly aiModerationService: AiModerationService,
  ) { }

  async autoFixJob(userId: string, jobId: string, insightInstruction: string, matchingQueue: Queue) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter || recruiter.recruiterSubscription?.planType !== 'GROWTH' || !recruiter.companyId) {
      throw new Error('Tính năng Sửa Tự Động bằng AI chỉ dành cho tài khoản GROWTH thuộc công ty.');
    }

    const job = await this.prisma.jobPosting.findFirst({
      where: { jobPostingId: jobId, companyId: recruiter.companyId },
    });

    if (!job) throw new Error('Không tìm thấy tin tuyển dụng hoặc không có quyền.');

    const currentStruct = (job.structuredRequirements as any) || {};
    if (currentStruct.autoFixedByAI) {
      throw new Error('Tin tuyển dụng này đã được AI tự động sửa 1 lần, không thể sửa tự động lại.');
    }

    const prompt = `Bạn là AI chuyên tối ưu Job Description (JD). Dưới đây là thông tin JD hiện tại:
Tiêu đề: ${job.title}
Mô tả: ${job.description || ''}
Yêu cầu: ${job.requirements || ''}
Quyền lợi: ${job.benefits || ''}

Hãy SỬA ĐỔI JD này dựa trên CỐ VẤN sau: "${insightInstruction}"
**Lưu ý quan trọng**: Giữ nguyên thông tin không liên quan đến cố vấn. 
**BẮT BUỘC**: 
1. Sử dụng thẻ HTML chuẩn (<ul>, <li>, <p>, <strong>, <br>) để định dạng văn bản. TUYỆT ĐỐI KHÔNG dùng Markdown.
2. TUYỆT ĐỐI KHÔNG sử dụng emoji.
3. SỬ DỤNG 100% TIẾNG VIỆT CHÍNH TẢ CHUẨN MỰC.
TRẢ VỀ DUY NHẤT một chuỗi JSON chuẩn:
{
  "title": "Tiêu đề mới (nếu cần đổi)",
  "description": "Mô tả đã tối ưu",
  "requirements": "Yêu cầu đã tối ưu",
  "benefits": "Quyền lợi đã tối ưu"
}
`;

    let aiResponse = '';
    let success = false;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an HR JD Editor. Reply in JSON.' }, { role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } });
        aiResponse = groqRes.data.choices[0].message.content;
        if (aiResponse) success = true;
      } catch (e: any) { this.logger.warn(`Groq autoFixJob failed: ${e.message}`); }
    }

    if (!success) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const mId of models) {
        if (success) break;
        try {
          const model = (this.aiChatService as any).genAI.getGenerativeModel({ model: mId, generationConfig: { responseMimeType: "application/json" } });
          const result = await model.generateContent(prompt);
          aiResponse = result.response.text();
          if (aiResponse) success = true;
        } catch (e) { }
      }
    }

    if (!success || !aiResponse) throw new Error('Không thể sử dụng AI lúc này.');

    try {
      const parsed = JSON.parse(aiResponse);
      const updatedStruct = { ...currentStruct, autoFixedByAI: true, isAiGenerated: true };
      const modResult = await this.aiModerationService.moderateJobContent(
        parsed.title || job.title, parsed.description || job.description, parsed.requirements || job.requirements, parsed.benefits || job.benefits,
        ((job.structuredRequirements as any)?.hardSkills) || [], job.jobTier
      );
      const finalStatus = (modResult.safe && modResult.score >= 50) ? 'APPROVED' : 'PENDING';

      await this.prisma.$transaction([
        this.prisma.jobPosting.update({
          where: { jobPostingId: jobId },
          data: { title: parsed.title || job.title, description: parsed.description || job.description, requirements: parsed.requirements || job.requirements, benefits: parsed.benefits || job.benefits, status: finalStatus, structuredRequirements: updatedStruct },
        }),
        this.prisma.recruiter.update({ where: { recruiterId: recruiter.recruiterId }, data: { aiInsightsCacheKey: null } })
      ]);

      try { await matchingQueue.add('match', { jobId }); } catch (err) { }
      return { success: true, message: 'Cập nhật JD thành công' };
    } catch (e) { throw new Error('AI trả về dữ liệu không hợp lệ.'); }
  }

  async generateJdFromPrompt(userId: string, promptInfo: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { recruiterSubscription: true },
    });

    if (!recruiter || !recruiter.recruiterSubscription?.planType) {
      throw new ForbiddenException('Tính năng Viết JD tự động chỉ hỗ trợ với tài khoản VIP.');
    }

    const extractionPrompt = `Bạn là hệ thống trích xuất thông tin tuyển dụng. Phân tích và chuyển thành JSON: "${promptInfo}"... [Rules for JD generation]`;

    let jobData: any = null;
    let success = false;

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an elite HR Recruiter API. Output extremely detailed JD in JSON. Use fluent Vietnamese.' }, { role: 'user', content: extractionPrompt }],
          temperature: 0.2,
          response_format: { type: "json_object" }
        }, { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } });
        jobData = JSON.parse(groqRes.data.choices[0].message.content);
        success = true;
      } catch (error) { this.logger.error(`Groq generateJdFromPrompt failed`); }
    }

    if (!success) {
      const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const modelName of models) {
        try {
          const model = (this.aiChatService as any).genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json" } });
          const result = await model.generateContent(extractionPrompt);
          jobData = JSON.parse(result.response.text());
          success = true;
          break;
        } catch (error) { }
      }
    }

    if (!jobData) throw new Error('Không thể sử dụng dịch vụ AI lúc này.');
    return { success: true, data: jobData };
  }
}
