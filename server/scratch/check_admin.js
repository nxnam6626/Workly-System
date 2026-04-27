require('dotenv').config();
const { Pool } = require('pg');

async function checkAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(`
      SELECT u.email, a.* 
      FROM "User" u 
      LEFT JOIN "Admin" a ON u."userId" = a."userId"
      WHERE u.email = 'zighdevil@gmail.com'
    `);
    console.log(res.rows);
  } finally {
    await pool.end();
  }
}

checkAdmin();
