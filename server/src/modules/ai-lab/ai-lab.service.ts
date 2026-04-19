import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiLabService {
  private readonly logger = new Logger(AiLabService.name);

  constructor(private readonly configService: ConfigService) {}

  async processLabTest(options: {
    model: string;
    prompt: string;
    file?: Express.Multer.File;
    apiKey?: string;
  }) {
    const { model, prompt, file, apiKey } = options;
    const startTime = Date.now();

    try {
      // 1. Determine which API Key to use
      const finalApiKey = apiKey || this.configService.get<string>('GEMINI_API_KEY');
      if (!finalApiKey) {
        throw new Error('GEMINI_API_KEY không được tìm thấy. Vui lòng cung cấp API Key.');
      }

      // 2. Initialize Gemini instance
      const genAI = new GoogleGenerativeAI(finalApiKey);
      const generativeModel = genAI.getGenerativeModel(
        {
          model: model,
          generationConfig: {
            maxOutputTokens: 8192, // Max tokens for Flash series
            temperature: 0.1,
          },
        },
        { apiVersion: 'v1beta' },
      );

      // 3. Prepare content parts
      const parts: any[] = [prompt];

      if (file) {
        parts.push({
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          },
        });
      }

      // 4. Generate content
      const result = await generativeModel.generateContent(parts);
      const response = await result.response;
      const text = response.text();

      const duration = Date.now() - startTime;

      return {
        success: true,
        data: {
          text,
          model,
          metadata: {
            durationMs: duration,
            tokenEstimate: text.length / 4, // Rough estimation
            timestamp: new Date().toISOString(),
          },
        },
      };
    } catch (error: any) {
      this.logger.error(`AI Lab Error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        metadata: {
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
