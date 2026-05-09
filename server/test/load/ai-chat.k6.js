import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  // Bắt đầu với 5 người dùng ảo, tăng dần lên 20 người dùng trong 1 phút
  stages: [
    { duration: '10s', target: 5 }, // Ramp-up to 5 users
    { duration: '30s', target: 20 }, // Spike to 20 users
    { duration: '10s', target: 0 }, // Ramp-down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<15000'], // 95% requests should be below 15s (Timeout threshold)
    http_req_failed: ['rate<0.1'], // Error rate should be < 10%
  },
};

export default function () {
  // Thay đổi token xác thực nếu cần
  const token = __ENV.ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
  
  const url = 'http://localhost:4000/api/ai/chat';
  const payload = JSON.stringify({
    message: 'Bạn có thể giúp tôi viết một Job Description cho vị trí Frontend Developer (React) không?',
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    // Chờ tối đa 20s (để xem server có timeout ở 15s không)
    timeout: '20s',
  };

  const res = http.post(url, payload, params);

  // Kiểm tra kết quả
  check(res, {
    'is status 201 or 200': (r) => r.status === 200 || r.status === 201,
    'response time is less than 16s': (r) => r.timings.duration < 16000,
  });

  sleep(1);
}
