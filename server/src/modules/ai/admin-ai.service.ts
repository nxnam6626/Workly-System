import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../../prisma/prisma.service';
import { SqlGeneratorAgent } from './agents/sql-generator.agent';
import { ResponseAgent } from './agents/response.agent';

@Injectable()
export class AdminAiService {
  private genAI: GoogleGenerativeAI;
  private sqlGenerator: SqlGeneratorAgent;
  private responseAgent: ResponseAgent;
  private isConfigured: boolean = false;

  constructor(private prisma: PrismaService) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      this.genAI = new GoogleGenerativeAI(key);
      this.sqlGenerator = new SqlGeneratorAgent(this.genAI);
      this.responseAgent = new ResponseAgent(this.genAI);
      this.isConfigured = true;
    } else {
      console.warn('GEMINI_API_KEY is not configured for Admin AI.');
    }
  }

  async processAnalyticsQuery(userQuery: string): Promise<any> {
    if (!this.isConfigured) {
      return { answer: 'AI Analytics bị vô hiệu hóa do thiếu GEMINI_API_KEY.', sql: null, data: null };
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let currentSql = '';
    let lastError = '';

    while (attempt < MAX_RETRIES) {
      try {
        // Step 1: Generate or Regenerate SQL
        currentSql = await this.sqlGenerator.generateSql(
            userQuery, 
            attempt > 0 ? lastError : undefined, 
            attempt > 0 ? currentSql : undefined
        );

        console.log(`[AdminAI] Attempt ${attempt + 1} - Executing SQL: ${currentSql}`);

        // Security Check: Only allow SELECT
        if (!currentSql.trim().toUpperCase().startsWith('SELECT')) {
          throw new Error('Security Violation: Only SELECT queries are allowed.');
        }

        // Step 2: Execute SQL via Prisma (Try-Catch block)
        // Note: Using $queryRawUnsafe is risky. In production, consider a read-only DB user.
        const results = await this.prisma.$queryRawUnsafe(currentSql);

        // Step 3: Validate and Generate Response
        console.log(`[AdminAI] Query Success. Fetched ${Array.isArray(results) ? results.length : 1} records.`);
        const answer = await this.responseAgent.generateResponse(userQuery, Array.isArray(results) ? results : [results]);

        return {
          answer,
          sql: currentSql,
          data: results,
          attempts: attempt + 1
        };

      } catch (error: any) {
        lastError = error.message.substring(0, 500); // Send first 500 chars of error
        console.error(`[AdminAI] Attempt ${attempt + 1} Failed:`, lastError);
        attempt++;
        
        // If it's a security violation (not a SELECT statement), don't retry.
        if (lastError.includes('Security Violation')) {
           return {
              answer: 'Hệ thống đã chặn yêu cầu này vì lý do bảo mật (chỉ cho phép lệnh SELECT).',
              sql: currentSql,
              data: null
           };
        }
      }
    }

    // After MAX_RETRIES failures
    return {
      answer: 'Hệ thống AI không thể viết được câu truy vấn SQL chính xác sau 3 lần thử. Vui lòng thử diễn đạt lại câu hỏi.',
      sql: currentSql,
      data: null,
      error: lastError
    };
  }
}
