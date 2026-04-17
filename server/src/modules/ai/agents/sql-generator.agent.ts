import { GoogleGenerativeAI } from '@google/generative-ai';
import { ADMIN_SQL_SCHEMA_CONTEXT } from './sql-context';

export class SqlGeneratorAgent {
  constructor(private readonly genAI: GoogleGenerativeAI) {}

  async generateSql(
    userQuery: string,
    previousError?: string,
    failedSql?: string,
  ): Promise<string> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    let prompt = `${ADMIN_SQL_SCHEMA_CONTEXT}\n\nUser Question: "${userQuery}"\nGenerate the SQL query.`;

    if (previousError && failedSql) {
      prompt = `${ADMIN_SQL_SCHEMA_CONTEXT}\n\nUser Question: "${userQuery}"
      
You previously generated this SQL which failed:
${failedSql}

The database returned this error:
${previousError}

Fix the SQL query and return ONLY the corrected SQL string.`;
    }

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
