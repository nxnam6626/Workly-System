
const axios = require('axios');
require('dotenv').config();

async function listModels() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.log('No API Key');
    return;
  }
  
  console.log('--- RAW API TEST ---');
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
    const response = await axios.get(url);
    const models = response.data.models;
    console.log('Available Models:');
    models.forEach(m => {
      console.log(`- ${m.name} (${m.displayName})`);
    });
  } catch (e) {
    console.error('API Error:', e.response ? e.response.data : e.message);
  }
  console.log('--- RAW API TEST END ---');
}

listModels();
