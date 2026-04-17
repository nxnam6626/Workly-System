require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
async function test() {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContentStream('hello');
  for await (const chunk of result.stream) {
    console.log(chunk.text());
  }
}
test().catch(console.error);
