require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const defaultModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Default SDK hit OK');
    
    // With schema
    const schemaModel = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });
    
    const result = await schemaModel.generateContent('Say hello in JSON format {"hello": "world"}');
    console.log(result.response.text());
  } catch (e) {
    console.error("Test 1 error:", e.message);
  }

  // Test with apiVersion v1beta
  try {
    const errorModel = genAI.getGenerativeModel(
      { model: 'gemini-1.5-flash' },
      { apiVersion: 'v1beta' }
    );
    const result2 = await errorModel.generateContent('Say hello in JSON format {"hello": "world"}');
    console.log("Test 2 OK:", result2.response.text());
  } catch(e) {
    console.error("Test 2 error:", e.message);
  }
}
test();
