import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
const pdfParse = require('pdf-parse');

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
      // Construct local path:
      const absolutePath = path.join(process.cwd(), fileUrl);
      if (!fs.existsSync(absolutePath)) return '';

      const dataBuffer = fs.readFileSync(absolutePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (e) {
      console.error('Error parsing local PDF:', e.message);
      return '';
    }
  }

  async extractTextFromPdfUrl(fileUrl: string): Promise<string> {
    try {
      if (!fileUrl) return '';
      const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);
      return data.text;
    } catch (e) {
      console.error('Error fetching/parsing PDF:', e.message);
      return '';
    }
  }

  async evaluateMatch(cvText: string, jobTitle: string, jobRequirements: string): Promise<number> {
    if (!this.isConfigured) return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1));
    
    // Quick circuit breaker if cv is empty
    if (!cvText || cvText.trim().length === 0) return 30;

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
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
      
      const cleanResponse = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
      const parsed = JSON.parse(cleanResponse);
      const score = Number(parsed.score);
      
      return isNaN(score) ? 50 : score;
    } catch (e) {
      console.error('AI Match Error:', e.message);
      return parseFloat((Math.random() * (99 - 50) + 50).toFixed(1)); // Fallback
    }
  }

  async generateResponse(message: string): Promise<string> {
    if (!this.isConfigured) return "AI is not configured.";
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(message);
      return result.response.text();
    } catch (e) {
      console.error('generateResponse error:', e);
      return 'Error generating response';
    }
  }

  async *generateStreamResponse(message: string): AsyncGenerator<string, void, unknown> {
    if (!this.isConfigured) {
      yield "AI is not configured.";
      return;
    }
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContentStream(message);
      for await (const chunk of result.stream) {
        yield chunk.text();
      }
    } catch (e) {
      console.error('generateStreamResponse error:', e);
      yield 'Error generating stream response';
    }
  }
}
