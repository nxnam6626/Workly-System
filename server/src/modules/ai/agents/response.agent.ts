import { GoogleGenerativeAI } from '@google/generative-ai';

export class ResponseAgent {
  constructor(private readonly genAI: GoogleGenerativeAI) {}

  async generateResponse(userQuery: string, dataRows: any[]): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // To prevent token explosion, truncate data if it's too large
    let safeData = dataRows;
    if (dataRows.length > 50) {
      safeData = dataRows.slice(0, 50);
    }
    const dataString = JSON.stringify(safeData);

    const prompt = `You are a data analyst for the Workly Admin Dashboard. 
The admin asked: "${userQuery}"
The database returned this raw JSON data:
${dataString}

${dataRows.length > 50 ? '(Note: The data was truncated to 50 rows due to size limits. Please mention this if relevant).' : ''}

Analyze the data and provide a concise, professional answer in Vietnamese. 
If the data is an array of numbers/counts, tell them the exact number clearly. 
Do not include technical SQL jargon in the final answer. Provide insights if obvious.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }
}
