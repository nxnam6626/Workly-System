const axios = require('axios');
const FormData = require('form-data');

async function test() {
  try {
    console.log('Logging in as cand_bulk1@test.com...');
    const loginRes = await axios.post('http://localhost:3001/auth/login', {
      email: 'cand_bulk1@test.com',
      password: 'password123',
    });
    
    const token = loginRes.data.accessToken;
    console.log('Login successful! Token:', token.substring(0, 10) + '...');

    const form = new FormData();
    // Create a mock PDF buffer (actually just text, but with pdf mimetype to trigger extraction)
    const mockPdfBuffer = Buffer.from('%PDF-1.4 mock content text');
    form.append('file', mockPdfBuffer, {
      filename: 'cv.pdf',
      contentType: 'application/pdf',
    });

    console.log('Sending cv/extract request...');
    const extractRes = await axios.post('http://localhost:3001/candidates/cv/extract', form, {
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(),
      },
    });

    console.log('Success!', extractRes.data);
  } catch (err) {
    console.error('Error during test:');
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}

test();
