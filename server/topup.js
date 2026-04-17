const { Client } = require('pg');
const crypto = require('crypto');

async function main() {
  const client = new Client({ connectionString: "postgresql://postgres.jusrfiiboybrhaocqjdj:DuyTien2026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true" });
  await client.connect();
  
  const res = await client.query(`
    UPDATE "RecruiterWallet" rw
    SET balance = balance + 1000000
    FROM "Recruiter" r
    JOIN "User" u ON u."userId" = r."userId"
    WHERE rw."recruiterId" = r."recruiterId"
      AND u.email = 'nguyenduytien2905@gmail.com'
    RETURNING rw."walletId", rw.balance;
  `);

  if (res.rows.length === 0) {
    console.log('User or wallet not found in remote Database');
  } else {
    const walletId = res.rows[0].walletId;
    const balance = res.rows[0].balance;
    const transactionId = crypto.randomUUID();
    
    await client.query(`
       INSERT INTO "Transaction" ("transactionId", amount, type, description, "walletId", status, "createdAt")
       VALUES ($1, 1000000, 'DEPOSIT', 'Được nạp trực tiếp qua hệ thống Admin', $2, 'SUCCESS', NOW())
    `, [transactionId, walletId]);

    console.log('Successfully added 1000000 credits. New balance: ' + balance);
  }
  await client.end();
}
main().catch(console.error);
