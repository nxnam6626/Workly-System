require('dotenv').config();
const { Pool } = require('pg');

async function checkUserRoles() {
  const connectionString = process.env.DATABASE_URL;
  const pool = new Pool({ connectionString });
  
  try {
    const email = 'admin@test.com';
    const query = `
      SELECT u.email, r."roleName" 
      FROM "User" u 
      JOIN "UserRole" ur ON u."userId" = ur."userId" 
      JOIN "Role" r ON ur."roleId" = r."roleId" 
      WHERE u.email = $1;
    `;
    
    const res = await pool.query(query, [email]);
    if (res.rows.length === 0) {
      console.log(`User ${email} does NOT exist.`);
    } else {
      console.log(`User: ${email}`);
      console.log(`Roles:`, res.rows.map(row => row.roleName));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkUserRoles();
