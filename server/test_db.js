const { Client } = require('pg');

async function test(url, name) {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    console.log(name + '_SUCCESS');
    await client.end();
  } catch (e) {
    console.log(name + '_FAIL: ' + e.message);
  }
}

async function main() {
  await test('postgresql://postgres:admin@localhost:5432/workly_system', 'ADMIN');
  await test('postgresql://postgres:postgres123@localhost:5432/workly', 'WORKLY');
  await test('postgresql://postgres:xeQRqOvjuz2tz1Z2@localhost:5432/postgres', 'SUPABASE');
}
main();
