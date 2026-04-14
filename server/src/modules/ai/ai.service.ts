import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
/** Bóc text từ buffer PDF dùng pdfjs-dist */
async function parsePdfBuffer(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const standardFontDataUrl =
      path
        .join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts')
        .replace(/\\/g, '/') + '/';

    const data = new Uint8Array(buffer);
    const pdf = await pdfjsLib.getDocument({
      data: data,
      standardFontDataUrl: standardFontDataUrl,
    }).promise;

    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + ' \n';
    }
    return fullText;
  } catch (error) {
    throw new Error('Failed to parse PDF using pdfjs: ' + error.message);
  }
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private isConfigured: boolean = false;

  constructor() {
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
      return await parsePdfBuffer(dataBuffer);
    } catch (e) {
      console.error('Error parsing local PDF:', e.message);
      return '';
    }
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, {
        responseType: 'arraybuffer',
      });
      return await parsePdfBuffer(Buffer.from(response.data));
    } catch (e) {
      console.error('Error fetching/parsing PDF:', e.message);
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

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });

      const prompt = `You are a strict HR AI Assistant. Evaluate the candidate's CV against the Job Title and Job Requirements.
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}
      Candidate CV Text: ${cvText.substring(0, 15000)}
      
      Evaluate their relevant skills, experience years, and degree.
      Return ONLY a JSON response in the following format (no markdown, no backticks, no extra text):
      {"score": 85}
      
      Score should be an integer from 10 to 99 based on how well the CV matches the specific requirements. Unrelated CVs should score low (10-30).`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanResponse = responseText
        .replace(/```json/gi, '')
        .replace(/```/gi, '')
        .trim();
      const parsed = JSON.parse(cleanResponse);
      const score = Number(parsed.score);

      return isNaN(score) ? 50 : score;
    } catch (e) {
      console.error('AI Match Error:', e.message);
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1)); // Fallback
    }
  }

  async extractFocusSkills(jobTitle: string, jobRequirements: string): Promise<string[]> {
    if (!this.isConfigured) return [];
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `Extract exactly 3 core "Focus Skills" (Kỹ năng trọng tâm) for the following job in Vietnamese. Return ONLY a JSON array of strings. Example: ["ReactJS", "NodeJS", "TypeScript"].
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanResponse = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanResponse);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
      return [];
    } catch (e) {
      console.error('AI Focus Skills Error:', e.message);
      return [];
    }
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

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured) return 'AI is not configured.';
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (e) {
      console.error('generateResponse error:', e);
      return 'Error generating response';
    }
  }

  async *generateStreamResponse(
    message: string,
  ): AsyncGenerator<string, void, unknown> {
    if (!this.isConfigured) {
      yield 'AI is not configured.';
      return;
    }
    
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
          yield 'Hệ thống đánh giá AI đang nhận lượng truy cập quá tải. Vui lòng thử lại sau ít phút!';
          return;
        }
    }
  }
}
