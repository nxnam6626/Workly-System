const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'workly_system',
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to database');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Successfully enabled pgvector extension!');
  } catch (err) {
    console.error('Failed to enable pgvector:', err.message);
  } finally {
    await client.end();
  }
}

main();
