import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private ai: any = null;
  private readonly modelName = 'gemini-2.5-flash'; // Phù hợp nhất cho Key hiện tại của bạn

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.ai = new GoogleGenAI({ apiKey });
      this.logger.log(`Advanced AI Service initialized with model: ${this.modelName}`);
    } else {
      this.logger.error('GEMINI_API_KEY is missing in configuration!');
    }
  }

  async generateResponse(prompt: string): Promise<string> {
    if (!this.ai) {
      throw new Error('AI Service not initialized. Please check GEMINI_API_KEY.');
    }

    try {
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents,
      });

      return response.text;
    } catch (error) {
      this.logger.error(`Error generating AI response: ${error.message}`);
      return "Xin lỗi, tôi gặp chút trục trặc khi kết nối với bộ não AI. Bạn hãy thử lại sau nhé!";
    }
  }

  /**
   * Generates a streaming response for the chat
   */
  async *generateStreamResponse(prompt: string): AsyncGenerator<string> {
    if (!this.ai) {
      throw new Error('AI Service not initialized');
    }

    try {
      const contents = [{ role: 'user', parts: [{ text: prompt }] }];

      this.logger.log(`Starting generation for model: ${this.modelName}`);
      const response = await this.ai.models.generateContentStream({
        model: this.modelName,
        contents,
      });

      this.logger.log('Successfully started AI stream');

      for await (const chunk of response) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error: any) {
      this.logger.error(`Streaming error: ${error.message}`, error.stack);
      console.error('FULL ERROR:', error);
      yield ` [Lỗi kết nối AI: ${error.message}] `;
    }
  }
}
