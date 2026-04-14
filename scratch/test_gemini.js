const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../server/.env' });

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  console.log('Using Key:', key ? 'FOUND' : 'NOT FOUND');
  if (!key) return;

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  try {
    console.log('Testing generateContent...');
    const result = await model.generateContent('Say hello');
    console.log('Response:', result.response.text());
    console.log('SUCCESS');
  } catch (e) {
    console.error('FAILED:', e.message);
    if (e.response) {
      console.error('Status:', e.response.status);
      console.error('Data:', JSON.stringify(e.response.data));
    }
  }
}

testGemini();
