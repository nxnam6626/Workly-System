const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin@localhost:5432/workly_system' });
  await client.connect();
  const res = await client.query(`UPDATE "RecruiterSubscription" SET "maxBasicPosts" = 5, "maxVipPosts" = 2, "maxUrgentPosts" = 0 WHERE "planType" = 'LITE'`);
  console.log('Updated LITE ' + res.rowCount);
  await client.end();
}

main().catch(console.error);
