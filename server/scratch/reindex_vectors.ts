import { PrismaClient } from '../src/generated/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function generateEmbedding(text: string) {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const cleaned = text.replace(/[\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 10000);
  const result = await model.embedContent(cleaned);
  return result.embedding.values;
}

async function main() {
  console.log('--- Bắt đầu khởi tạo Vector cho dữ liệu cũ ---');

  // 1. Xử lý Job Postings
  const jobs = await (prisma as any).jobPosting.findMany({
    where: { OR: [{ embedding: null }] },
  });
  console.log(`Tìm thấy ${jobs.length} tin tuyển dụng cần xử lý.`);

  for (const job of jobs) {
    console.log(`- Đang tạo vector cho Job: ${job.title}`);
    const vector = await generateEmbedding(`${job.title} ${job.description} ${job.requirements}`);
    await (prisma as any).jobPosting.update({
      where: { jobPostingId: job.jobPostingId },
      data: { embedding: vector },
    });
  }

  // 2. Xử lý CVs
  const cvs = await (prisma as any).cv.findMany({
    where: { OR: [{ embedding: null }] },
  });
  console.log(`Tìm thấy ${cvs.length} CV cần xử lý.`);

  for (const cv of cvs) {
    console.log(`- Đang tạo vector cho CV ID: ${cv.cvId}`);
    const vector = await generateEmbedding(`${cv.summary || ''} ${cv.experience || ''} ${cv.skills.join(' ')}`);
    await (prisma as any).cv.update({
      where: { cvId: cv.cvId },
      data: { embedding: vector },
    });
  }

  console.log('--- Hoàn tất re-indexing! ---');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
