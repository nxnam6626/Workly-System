const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });
const axios = require('axios');
(async () => {
    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const models = response.data.models.map(m => m.name).filter(name => name.includes('gemini'));
        console.log("AVAILABLE MODELS:", models);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
})();
