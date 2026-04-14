import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testStreaming() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContentStream('Tell me a short joke');
    console.log('Starting stream...');
    for await (const chunk of result.stream) {
      console.log('Chunk:', chunk.text());
    }
    console.log('✅ Streaming worked.');
  } catch (e) {
    console.error('❌ Streaming failed:', e.message);
  }
}

testStreaming();
