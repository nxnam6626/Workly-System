const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: './.env' });

async function run() {
    const key = process.env.GEMINI_API_KEY;
    console.log('Testing with key:', key);
    const genAI = new GoogleGenerativeAI(key);
    
    // Simulate prompt
    const jobSummary = [
        { id: '1', title: 'Test JD', status: 'APPROVED', views: 100, applicants: 5, hasSalary: true, descLength: 500, reqLength: 300, daysAgo: 5 }
    ];
    const prompt = `Bạn là chuyên gia tư vấn tuyển dụng AI. Phân tích dữ liệu thực tế sau và trả về JSON thuần (không markdown, không backtick):

DỮ LIỆU:
- Tổng JD: 1 (Đang mở: 1)
- Tổng lượt xem: 100 | Ứng viên nộp: 5 | Tỉ lệ: 5%
- Gói: Pro

DANH SÁCH JD: ${JSON.stringify(jobSummary)}

Trả về JSON:
{"insights":[{"type":"warning|tip|success","title":"<=60 ký tự","desc":"<=150 ký tự gợi ý hành động","priority":"high|medium|low"}],"jdScores":[{"title":"Tên JD","score":0-100,"trend":"up|down|stable","reason":"<=60 ký tự","weaknesses":["1-2 điểm yếu ngắn gọn như: Thiếu lương, Yêu cầu quá dài..."]}],"summary":"1-2 câu tổng quan"}

Quy tắc score: hasSalary +20, descLength 400-800 +20, applicants/views tốt +25, daysAgo<7 +15, APPROVED +20. Tối đa 3 insights. Phân tích thêm những điểm yếu của từng JD cụ thể (dựa vào JD data) và đưa vào mảng weaknesses.`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
    for (const modelName of modelsToTry) {
        try {
            console.log(`Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            console.log(`Success with ${modelName}:`, result.response.text());
            break;
        } catch (e) {
            console.error(`Failed with ${modelName}: ${e.message}`);
        }
    }
}
run();
