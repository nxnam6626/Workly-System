import 'dotenv/config';
import axios from 'axios';

async function main() {
  console.log('--- BẮT ĐẦU ĐỒNG BỘ ELASTICSEARCH ---');
  try {
    const response = await axios.get('http://localhost:3001/job-postings/resync-es');
    console.log('✅ Kết quả re-index:', response.data);
  } catch (error: any) {
    console.error('❌ Lỗi khi gọi API re-index:', error.response?.data || error.message);
  }
}

main();
