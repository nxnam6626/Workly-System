
const { Client } = require('@elastic/elasticsearch');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function diagnose() {
  console.log('--- DIAGNOSIS START ---');
  
  // 1. Check Env
  const key = process.env.GEMINI_API_KEY;
  console.log('Gemini API Key defined:', !!key);
  
  // 2. Test Elasticsearch
  try {
    const client = new Client({ node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200' });
    const health = await client.cluster.health();
    console.log('Elasticsearch Health:', health.body ? health.body.status : health.status);
    
    const indices = await client.cat.indices({ format: 'json' });
    const jobsIndex = indices.body ? indices.body.find(i => i.index === 'jobs') : indices.find(i => i.index === 'jobs');
    console.log('Jobs Index exists:', !!jobsIndex);
  } catch (e) {
    console.error('Elasticsearch Error:', e.message);
  }
  
  // 3. Test Gemini Model & List Models
  if (key) {
    try {
      const genAI = new GoogleGenerativeAI(key);
      
      console.log('Listing available models...');
      // Note: listing models often requires older SDK patterns or v1 API
      // For now, let's just try to test v1 specifically
      const modelV1 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const resultV1 = await modelV1.generateContent('Hello v1');
      console.log('Gemini v1 Test Response:', resultV1.response.text().substring(0, 50) + '...');
      
    } catch (e) {
      console.error('Gemini v1 Error:', e.message);
      
      try {
        const genAI = new GoogleGenerativeAI(key);
        const modelBeta = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }, { apiVersion: 'v1beta' });
        const resultBeta = await modelBeta.generateContent('Hello v1beta');
        console.log('Gemini v1beta Test Response:', resultBeta.response.text().substring(0, 50) + '...');
      } catch (e2) {
        console.error('Gemini v1beta Error:', e2.message);
      }
    }
  }
  
  console.log('--- DIAGNOSIS END ---');
}

diagnose();
