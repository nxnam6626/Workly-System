import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testSpecifiedModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const res = await model.generateContent('Hello');
    console.log('✅ gemini-2.5-flash worked:', res.response.text());
  } catch (e) {
    console.error('❌ gemini-2.5-flash failed:', e.message);
  }
}

testSpecifiedModel();
