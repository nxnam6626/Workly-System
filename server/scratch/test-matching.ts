import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataParserService } from '../src/modules/matching-engine/services/data-parser.service';
import { MatchingOrchestratorService } from '../src/modules/matching-engine/services/matching-orchestrator.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('TestMatching');
  logger.log('🚀 Đang khởi tạo ứng dụng để test cả 2 model...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataParser = app.get(DataParserService);
  const genAI = (dataParser as any).genAI;

  try {
    const testText = 'Kỹ sư phần mềm NodeJS với 3 năm kinh nghiệm';

    // 1. Test Model Chính
    logger.log('--- STEP 1: Testing "gemini-embedding-2-preview" (Gemini Embedding 2) ---');
    try {
      const model2 = genAI.getGenerativeModel({ model: 'gemini-embedding-2-preview' });
      const res2 = await model2.embedContent(testText);
      logger.log(`✅ gemini-embedding-2-preview hoạt động! Vector length: ${res2.embedding.values.length}`);
    } catch (e) {
      logger.error(`❌ gemini-embedding-2-preview thất bại: ${e.message}`);
    }

    // 2. Test Model Dự phòng
    logger.log('--- STEP 2: Testing "gemini-embedding-001" (Gemini Embedding 1) ---');
    try {
      const model1 = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
      const res1 = await model1.embedContent(testText);
      logger.log(`✅ gemini-embedding-001 hoạt động! Vector length: ${res1.embedding.values.length}`);
    } catch (e) {
      logger.error(`❌ gemini-embedding-001 thất bại: ${e.message}`);
    }

  } catch (error) {
    logger.error(`❌ Lỗi hệ thống khi chạy test: ${error.message}`);
  } finally {
    await app.close();
    logger.log('🏁 Kết thúc quá trình test.');
  }
}

bootstrap();
