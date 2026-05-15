const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/workly' // Assuming default local db
});

async function main() {
  await client.connect();
  const res = await client.query(`SELECT status FROM "JobPosting" WHERE "jobPostingId" = 'd75c72b0-ad4e-4344-8339-3c33b36cb199'`);
  console.log('Job status directly from DB:', res.rows[0]?.status);
  
  const matches = await client.query(`SELECT count(*) FROM "JobMatch" jm JOIN "JobPosting" jp ON jm."jobPostingId" = jp."jobPostingId" WHERE jp.status = 'APPROVED' AND jp."jobPostingId" = 'd75c72b0-ad4e-4344-8339-3c33b36cb199'`);
  console.log('Is it returned by JobMatch join?', matches.rows[0].count);
  await client.end();
}
main().catch(e => console.error(e));
