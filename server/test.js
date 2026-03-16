const fs = require('fs');

async function test() {
  try {
    const randEmail = `admin${Date.now()}@test.com`;
    await fetch('http://localhost:3000/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail, password: 'password123', role: 'ADMIN', fullName: 'Admin User' })
    });
    
    const loginRes2 = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: randEmail, password: 'password123' })
      });
    const data = await loginRes2.json();
    console.log('Login tokens:', data.accessToken ? 'OK' : data);

    const logoutRes = await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${data.accessToken}`
      }
    });

    const logoutData = await logoutRes.json();
    console.log('Logout:', logoutRes.status, logoutData);
  } catch(e) {
    console.error(e);
  }
}
test();
