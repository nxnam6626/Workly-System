<div align="center">
  <img src="https://via.placeholder.com/150x150.png?text=Workly+AI" alt="Workly Logo" width="150" height="150">
  <h1>Workly System</h1>
  <p><em>Nền tảng tuyển dụng thông minh được siêu nạp bởi Trí Tuệ Nhân Tạo (AI)</em></p>
</div>

<p align="center">
  <a href="#features">Các Tính Năng</a> •
  <a href="#tech-stack">Công Nghệ Sử Dụng</a> •
  <a href="#project-structure">Cấu Trúc Hệ Thống</a> •
  <a href="#getting-started">Hướng Dẫn Cài Đặt</a> •
  <a href="#deployment">Triển Khai</a>
</p>

---

## 🎯 Giới Thiệu (Introduction)

**Workly System** là một hệ sinh thái kết nối Tuyển dụng và Ứng viên mang tính đột phá, tích hợp trực tiếp **Cố vấn AI (Gemini)** vào mọi giai đoạn của quá trình tuyển dụng. Nền tảng giúp tối ưu hóa việc phân tích JD, gợi ý CV tự động, hỗ trợ ứng viên viết hồ sơ và theo dõi số liệu thống kê bằng AI - giảm thiểu mọi thao tác thủ công với độ chính xác cao.

## ✨ Các Tính Năng Nổi Bật (Key Features)

### Cấp độ Ứng viên (Candidate)
- 📄 **Trình phân tích CV AI**: Tự động bóc tách kỹ năng, kinh nghiệm từ file PDF.
- 💬 **Trò chuyện cùng AI**: Chatbot hỗ trợ giải đáp thắc mắc về công việc, gợi ý việc làm và tư vấn lộ trình.
- 🔍 **Tìm kiếm việc làm thông minh**: Cỗ máy tìm kiếm tích hợp bộ lọc linh hoạt.
- 🔔 **Hệ thống Thông báo Realtime**: Socket.IO giữ kết nối vòng lặp ngay khi có lời mời tuyển dụng!

### Cấp độ Nhà Tuyển Dụng (Recruiter)
- 🪄 **Tối ưu Job Description (JD)**: Tạo/Tối ưu hoá tin tuyển dụng với góc nhìn của AI (Chỉnh sửa ngôn từ tự động, chuẩn hóa fomat).
- ⚡ **Auto-Matching & Auto-Invite**: Chạy nền tự động (Background Jobs) rà soát Ứng viên phù hợp và gửi lời mời ngay khi tin được đăng tải.
- 📊 **AI Insights Dashboard**: Tóm tắt, đo lường điểm mạnh/điểm yếu thông kê các chiến dịch đăng tin.
- 💳 **Mua Credit Tuyển dụng**: Tích hợp thanh toán QR Code bằng API **PayOS**.

### Cấp độ Quản trị (Admin)
- 🛡️ **Hệ thống Kiểm duyệt (Moderation)**: Đánh giá điểm rủi ro (Risk score) của các tin tuyển dụng dựa trên AI.
- 📈 **Bảng điều khiển Thống kê**: Báo cáo doanh thu, hoạt động hệ thống.

---

## 🛠 Công Nghệ Sử Dụng (Tech Stack)

Hệ thống được xây dựng 100% bằng hệ sinh thái **TypeScript / JavaScript** linh hoạt:

**🌍 Web Client (Frontend)**
- ⚡ **Next.js 14** (App Router) + React
- 🎨 **Tailwind CSS** + Framer Motion (Animation)
- 📦 **Zustand** (Quản lý State)
- 🔌 **Socket.IO Client**

**⚙️ Server (Backend)**
- 🟩 **NestJS** (Framework kiến trúc mạnh mẽ)
- 🗄️ **Prisma ORM** + **PostgreSQL** (Cơ sở dữ liệu)
- 🧠 **Google Generative AI (Gemini 2.0)**
- 🏎️ **Redis & BullMQ** (Xử lý tác vụ nền/Hàng đợi)
- 🌐 **Socket.IO** (WebSocket Gateway)

**☁️ 3rd Party Cloud & APIs**
- **Supabase** (Lưu trữ file PDF / Bucket storage)
- **PayOS** (Cổng thanh toán tự động)
- **RapidAPI** (Hỗ trợ Data Crawler)

---

## 📂 Cấu Trúc Hệ Thống (Project Structure)

Workly hoạt động trên mô hình Monorepo chia làm 2 thư mục chính:

```text
Workly-System/
├── server/                     # NEST.JS BACKEND
│   ├── src/
│   │   ├── modules/            # Domain logic (auth, jobs, ai, admin, ...)
│   │   ├── prisma/             # Lược đồ cơ sở dữ liệu (schema.prisma)
│   │   └── main.ts             # Entry point
│   ├── .env                    # Biến môi trường local backend
│   └── package.json    
└── web-client/                 # NEXT.JS FRONTEND
    ├── app/                    # Routing (Recruiter, Public, API...)
    ├── components/             # React UI Components
    ├── lib/                    # Helpers, Axios API interface
    ├── stores/                 # Zustand Stores
    ├── .env.local              # Biến môi trường local frontend
    └── package.json    
```

---

## 🚀 Hướng Dẫn Cài Đặt (Getting Started)

### 1. Yêu cầu hệ thống
- `Node.js` >= 18.x
- `PostgreSQL` >= 14.x
- `Redis` (Chạy local hoặc Upstash)

### 2. Khởi tạo Backend (Server)
Mở cửa sổ Terminal và trỏ vào thư mục `server`:
```bash
cd server

# Cài đặt thư viện
npm install

# Đổi tên .env.example thành .env và điền cấu hình (PGSQL, Redis, Gemini API...)
cp .env.example .env

# Chạy migration DB
npx prisma generate
npx prisma migrate dev

# Khởi động Backend server (Chạy tại port 3001)
npm run start:dev
```

### 3. Khởi tạo Frontend (Web Client)
Mở cửa sổ Terminal thứ 2 và trỏ vào thư mục `web-client`:
```bash
cd web-client

# Cài đặt thư viện
npm install

# Khởi động Next.js development server (Chạy tại port 3000)
npm run dev
```
Trang web hiện đã sẵn sàng tại: [`http://localhost:3000`](http://localhost:3000)

---

## 🚢 Triển Khai (Deployment)

Hệ thống được thiết kế để dễ dàng hoạt động trên môi trường Cloud:
1. **Front-End:** Khuyên dùng deploy qua **[Vercel](https://vercel.com/)**. Khai báo các biến tại file `web-client/.env.production`.
2. **Back-End:** Cực kỳ tương thích với các giải pháp Container / PaaS như **[Render](https://render.com/)**, **Railway**, hoặc **AWS/VPS**. Tham khảo cấu hình tại `server/.env.production`.
3. **Database:** Dùng **Supabase** hoặc **NeonDB** làm PostgreSQL managed service.

⭐ *Sản phẩm được tối ưu caching với AI nhằm tiết kiệm tài nguyên Quota và tăng độ tải trang!*
