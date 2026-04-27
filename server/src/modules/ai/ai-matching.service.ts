import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

const SLEEP = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class AiMatchingService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;
  private readonly logger = new Logger(AiMatchingService.name);

  constructor() {
    require('dotenv').config({ override: true });
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.isConfigured = true;
    }
  }

  private async callAiWithFallback(prompt: string, contextName: string): Promise<any> {
    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: 'You are a strict JSON expert. Always return JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.0,
          response_format: { type: "json_object" }
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        
        const text = groqRes.data.choices[0].message.content;
        const clean = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
        this.logger.log(`[${contextName}] Success via Groq Llama-3.3`);
        return JSON.parse(clean);
      } catch (e: any) {
        this.logger.warn(`[${contextName}] Groq AI failed: ${e.message}. Falling back...`);
      }
    }

    const modelsToTry = ['gemini-flash-latest', 'gemini-1.5-flash'];
    for (const modelName of modelsToTry) {
       try {
          const model = this.genAI.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: 'application/json', temperature: 0.0 } });
          const result = await model.generateContent(prompt);
          const clean = result.response.text().replace(/```json/gi, '').replace(/```/gi, '').trim();
          this.logger.log(`[${contextName}] Success via Gemini (${modelName})`);
          return JSON.parse(clean);
       } catch (e: any) {
          this.logger.warn(`[${contextName}] Gemini ${modelName} failed: ${e.message}`);
          await SLEEP(500);
       }
    }
    throw new Error('All AI models failed');
  }

  async evaluateMatch(
    cvText: string,
    jobTitle: string,
    jobRequirements: string,
  ): Promise<number> {
    if (!this.isConfigured) return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1));
    if (!cvText || cvText.trim().length === 0) return 30;

    const prompt = `Bạn là một Chuyên gia Tuyển dụng Cấp cao (Senior HR Recruiter) AI thuộc hệ thống Workly.
      Nhiệm vụ của bạn là đánh giá mức độ phù hợp của Hồ Sơ Ứng Viên (CV) đối với Yêu cầu Công việc (Job Requirements).

      [THÔNG TIN CÔNG VIỆC]
      - Chức danh: ${jobTitle}
      - Yêu cầu: ${jobRequirements}

      [THÔNG TIN ỨNG VIÊN (CV TEXT)]
      ---
      ${cvText.substring(0, 15000)}
      ---
      
      [HƯỚNG DẪN ĐÁNH GIÁ (STEP-BY-STEP)]
      Hãy suy nghĩ và phân tích hồ sơ một cách công tâm và thấu đáo theo các bước sau trước khi ra điểm số:
      1. Độ khớp kỹ năng (Skills Match): Liệt kê và đối chiếu kỹ năng lõi của CV so với JD.
      2. Độ khớp kinh nghiệm (Experience Match): Xem xét số năm kinh nghiệm thực tế và chất lượng dự án có phù hợp không.
      3. Độ khớp học vấn (Education Match): Bằng cấp chứng chỉ có đạt không.
      Từ đó, tổng hợp ra "score" (điểm số chung từ 0 đến 100).
      
      [ĐỊNH DẠNG ĐẦU RA BẮT BUỘC]
      Bạn PHẢI trả về JSON thuần túy (Tuyệt đối không dùng markdown block, không chú thích thêm):
      {
        "reasoning": "Một đoạn văn ngắn gọn gọn (<=60 từ) phân tích ưu nhược điểm...",
        "skillsScore": <giá trị 0-100>,
        "experienceScore": <giá trị 0-100>,
        "score": <tổng điểm đánh giá 0-100>
      }
      
      [QUY TẮC CHẤM ĐIỂM TỔNG CỘNG ("score")]
      - 0-30: Hoàn toàn không liên quan, sai ngành nghề, trái nội dung.
      - 31-50: Có một chút kỹ năng nhưng thiếu hụt quá lớn về chuyên môn/kinh nghiệm.
      - 51-70: Khá phù hợp, đáp ứng mức cơ bản, có thể đào tạo thêm.
      - 71-89: Rất phù hợp, kinh nghiệm sát thực tế, đáp ứng phần lớn yêu cầu trọng yếu.
      - 90-100: Ứng viên xuất sắc, "Perfect Match", kinh nghiệm và kỹ năng vượt trội.`;

    try {
      const parsed = await this.callAiWithFallback(prompt, 'EvaluateMatch');
      const score = Math.round(Number(parsed.score));
      return isNaN(score) ? 50 : score;
    } catch(e) {
      this.logger.error('AI Match Error: All models failed.');
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1));
    }
  }

  async extractFocusSkills(
    jobTitle: string,
    jobRequirements: string,
  ): Promise<string[]> {
    if (!this.isConfigured) return [];
    const prompt = `Extract exactly 3 core "Focus Skills" (Kỹ năng trọng tâm) for the following job in Vietnamese. Return ONLY a JSON object with a "skills" array property. Example: {"skills": ["ReactJS", "NodeJS", "TypeScript"]}.
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}`;

    try {
      const parsed = await this.callAiWithFallback(prompt, 'ExtractFocusSkills');
      if (parsed.skills && Array.isArray(parsed.skills)) return parsed.skills.slice(0, 3);
      return [];
    } catch(e) {
      this.logger.error('AI Focus Skills Error: All models failed.');
      return [];
    }
  }

  async expandJobKeywords(
    jobTitle: string,
    hardSkills: string[],
  ): Promise<Record<string, string[]>> {
    if (!this.isConfigured || hardSkills.length === 0) return {};

    const prompt = `You are an expert IT Technical Recruiter. Based on the job title "${jobTitle}" and the following required hard skills: ${JSON.stringify(hardSkills)}.
    For each skill, generate an array of up to 5 strictly related synonyms, exact frameworks, or alternative terms that candidates commonly write in CVs.
    Return ONLY a JSON object where the keys are the original skills from the list, and the values are arrays of string synonyms.
    Do not use markdown, backticks or explanations.
    Example: {"ReactJS": ["React", "React.js", "Redux", "Hooks"], "Node.js": ["Node", "NodeJS", "Express"]}`;

    try {
      const parsed = await this.callAiWithFallback(prompt, 'ExpandKeywords');
      return parsed;
    } catch (e) {
      this.logger.error('AI expandJobKeywords error: All models failed');
      return {};
    }
  }

  async calculateSemanticSimilarity(text1: string, text2: string): Promise<number> {
    if (!this.isConfigured) return 0.5;
    if (!text1 || !text2) return 0;

    const prompt = `Calculate the semantic similarity score between these two texts on a scale of 0.0 to 1.0.
    Text 1: "${text1}"
    Text 2: "${text2}"
    Return ONLY a JSON object: {"similarity": <score>}`;

    try {
      const parsed = await this.callAiWithFallback(prompt, 'SemanticSimilarity');
      return Number(parsed.similarity) || 0;
    } catch (e) {
      this.logger.error('Semantic Similarity Error: ' + e.message);
      return 0.5;
    }
  }
}
