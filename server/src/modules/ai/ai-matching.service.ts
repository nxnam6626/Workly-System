import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

  async evaluateMatch(
    cvText: string,
    jobTitle: string,
    jobRequirements: string,
  ): Promise<number> {
    if (!this.isConfigured)
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1));

    if (!cvText || cvText.trim().length === 0) return 30;

    const prompt = `You are a strict HR AI Assistant. Evaluate the candidate's CV against the Job Title and Job Requirements.
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}
      Candidate CV Text: ${cvText.substring(0, 15000)}
      
      Evaluate their relevant skills, experience years, and degree.
      Return ONLY a JSON response in the following format (no markdown, no backticks, no extra text):
      {"score": 85}
      
      Score should be an integer from 10 to 99 based on how well the CV matches the specific requirements. Unrelated CVs should score low (10-30).`;

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
    ];
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
        this.logger.warn(
          `[AiMatchingService] evaluateMatch error with ${modelName}. Trying next...`,
        );
        await SLEEP(500);
      }
    }
    this.logger.error('AI Match Error: All models failed.');
    return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1)); // Fallback
  }

  async extractFocusSkills(
    jobTitle: string,
    jobRequirements: string,
  ): Promise<string[]> {
    if (!this.isConfigured) return [];
    const prompt = `Extract exactly 3 core "Focus Skills" (Kỹ năng trọng tâm) for the following job in Vietnamese. Return ONLY a JSON array of strings. Example: ["ReactJS", "NodeJS", "TypeScript"].
      Job Title: ${jobTitle}
      Job Requirements: ${jobRequirements}`;

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
    ];
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
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
        return [];
      } catch (e: any) {
        this.logger.warn(
          `[AiMatchingService] extractFocusSkills error with ${modelName}. Trying next...`,
        );
        await SLEEP(500);
      }
    }
    this.logger.error('AI Focus Skills Error: All models failed.');
    return [];
  }

  async expandJobKeywords(
    jobTitle: string,
    hardSkills: string[],
  ): Promise<Record<string, string[]>> {
    if (!this.isConfigured || hardSkills.length === 0) return {};

    const modelsToTry = [
      'gemini-2.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
    ];

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
        text = text
          .replace(/```json/gi, '')
          .replace(/```/gi, '')
          .trim();
        return JSON.parse(text);
      } catch (e: any) {
        if (
          (e.message?.includes('503') || e.message?.includes('429')) &&
          i < modelsToTry.length - 1
        ) {
          this.logger.warn(
            `[AiMatchingService] expandJobKeywords error with ${modelsToTry[i]} (${e.message}). Switching fallback...`,
          );
          await SLEEP(500);
          continue;
        }
        this.logger.error('AI expandJobKeywords error: ' + e.message);
        return {};
      }
    }
    return {};
  }
}
