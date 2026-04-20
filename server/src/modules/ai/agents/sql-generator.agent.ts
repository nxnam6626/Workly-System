import { GoogleGenerativeAI } from '@google/generative-ai';
import { ADMIN_SQL_SCHEMA_CONTEXT } from './sql-context';
import axios from 'axios';

export class SqlGeneratorAgent {
  constructor(private readonly genAI: GoogleGenerativeAI) {}

  async generateSql(
    userQuery: string,
    previousError?: string,
    failedSql?: string,
  ): Promise<string> {

    let prompt = `${ADMIN_SQL_SCHEMA_CONTEXT}\n\nUser Question: "${userQuery}"\nGenerate the SQL query.`;

    if (previousError && failedSql) {
      prompt = `${ADMIN_SQL_SCHEMA_CONTEXT}\n\nUser Question: "${userQuery}"
      
You previously generated this SQL which failed:
${failedSql}

The database returned this error:
${previousError}

Fix the SQL query and return ONLY the corrected SQL string.`;
    }

    if (process.env.GROQ_API_KEY) {
      try {
        const groqRes = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'system', content: 'You are an expert SQL architect. Output ONLY the raw SQL query, no markdown blocks.' }, { role: 'user', content: prompt }],
          temperature: 0.1
        }, {
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' }
        });
        let sql = groqRes.data.choices[0].message.content;
        return sql.replace(/```sql/gi, '').replace(/```/gi, '').trim();
      } catch (e: any) {
        console.warn(`[SqlGenerator] Groq failed: ${e.message}. Falling back...`);
      }
    }

    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    let sql = result.response.text();

    // Clean up any markdown blocks if the model ignored the instruction
    sql = sql
      .replace(/```sql/gi, '')
      .replace(/```/gi, '')
      .trim();

    return sql;
  }
}
