const Redis = require('ioredis');

async function testForgot() {
  try {
    const randEmail = `admin_forgot_${Date.now()}@test.com`;
    console.log('\n--- 1. Registering user ---', randEmail);
    await fetch('http://localhost:3001/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail, password: 'oldpassword', role: 'ADMIN', fullName: 'Test Forgot' })
    });
    
    console.log('\n--- 2. Requesting forgot password ---');
    const forgotRes = await fetch('http://localhost:3001/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail })
    });
    const forgotData = await forgotRes.text();
    console.log('Forgot Password response:', forgotData);

    console.log('\n--- 3. Fetching token directly from local Redis ---');
    const redis = new Redis();
    const token = await redis.get(`reset_token:${randEmail}`);
    console.log('Got OTP Token from Redis:', token);

    console.log('\n--- 4. Resetting password ---');
    const resetRes = await fetch('http://localhost:3001/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail, token, newPassword: 'newpassword' })
    });
    const resetData = await resetRes.text();
    console.log('Reset Password response:', resetData);

    console.log('\n--- 5. Logging in with new password ---');
    const loginRes = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail, password: 'newpassword' })
    });
    const loginData = await loginRes.json();
    console.log('Login successful?', !!loginData.accessToken);

    redis.disconnect();
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
testForgot();
