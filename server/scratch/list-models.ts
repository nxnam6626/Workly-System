import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('GEMINI_API_KEY not found in .env');
    return;
  }

  console.log('--- Đang kiểm tra danh sách model khả dụng (v1) ---');
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1/models?key=${key}`
    );
    const data = response.data;
    if (data.models) {
      const embeddingModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes('embedContent'));
      console.log('Embedding Models tìm thấy:', embeddingModels.map((m: any) => m.name));
    } else {
      console.log('Không tìm thấy model nào. Phản hồi:', data);
    }
  } catch (e: any) {
    console.error('Lỗi khi gọi API v1:', e.message);
  }

  console.log('\n--- Đang kiểm tra danh sách model khả dụng (v1beta) ---');
  try {
    const response = await axios.get(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
    );
    const data = response.data;
    if (data.models) {
      const embeddingModels = data.models.filter((m: any) => m.supportedGenerationMethods.includes('embedContent'));
      console.log('Embedding Models tìm thấy:', embeddingModels.map((m: any) => m.name));
    } else {
      console.log('Không tìm thấy model nào. Phản hồi:', data);
    }
  } catch (e: any) {
    console.error('Lỗi khi gọi API v1beta:', e.message);
  }
}

listModels();
