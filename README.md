<div align="center">
  <img src="https://via.placeholder.com/150?text=Workly+System" alt="Workly Logo" width="150" height="150" style="border-radius: 20px;"/>
  <h1>Workly System</h1>
  <p><em>🚀 Nền tảng tuyển dụng thông minh thế hệ mới, siêu nạp bởi Trí Tuệ Nhân Tạo (AI)</em></p>

  <!-- Badges -->
  <p>
    <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js" />
    <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
    <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  </p>
</div>

<br />

<details>
  <summary><b>📖 MỤC LỤC</b> (Nhấn để mở rộng)</summary>

  - [🎯 Giới Thiệu](#-giới-thiệu)
  - [✨ Tính Năng Nổi Bật](#-tính-năng-nổi-bật)
    - [Dành cho Ứng viên (Candidate)](#dành-cho-ứng-viên-candidate)
    - [Dành cho Nhà Tuyển Dụng (Recruiter)](#dành-cho-nhà-tuyển-dụng-recruiter)
    - [Dành cho Quản trị viên (Admin)](#dành-cho-quản-trị-viên-admin)
  - [🛠 Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
  - [📂 Cấu Trúc Hệ Thống](#-cấu-trúc-hệ-thống)
  - [🚀 Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
  - [🧪 Kiểm Thử (Testing)](#-kiểm-thử-testing)
  - [🚢 Triển Khai (Deployment)](#-triển-khai-deployment)
</details>

---

## 🎯 Giới Thiệu

**Workly System** không chỉ là một trang web tìm việc thông thường, mà là một **Hệ sinh thái Tuyển dụng Toàn diện** tích hợp trực tiếp **Cố vấn AI (Google Gemini 2.0)** vào lõi hệ thống.

Sứ mệnh của nền tảng là tối ưu hóa điểm chạm giữa Nhà tuyển dụng và Ứng viên:
- **Tự động hóa** quá trình sàng lọc và gợi ý CV.
- **Tối ưu hóa** mô tả công việc (JD) với AI.
- **Đồng bộ hóa** luồng thông tin qua hệ thống Real-time Notifications.
- Mang lại trải nghiệm UI/UX **hiện đại, mượt mà** và đáng tin cậy.

---

## ✨ Tính Năng Nổi Bật

### 👨‍💻 Dành cho Ứng viên (Candidate)
- 📄 **Trình Phân Tích CV AI**: Tự động trích xuất kỹ năng, kinh nghiệm, học vấn từ file PDF với độ chính xác cao.
- 💬 **Trợ Lý AI Cá Nhân**: Chatbot hỗ trợ giải đáp thắc mắc, tư vấn lộ trình nghề nghiệp và gợi ý việc làm phù hợp 24/7.
- 🔍 **Tìm Kiếm Thông Minh**: Trình tìm kiếm tích hợp bộ lọc nâng cao (mức lương, địa điểm, hình thức làm việc).
- ⚡ **Theo Dõi Hồ Sơ Real-time**: Nhận thông báo qua Socket.IO ngay khi Nhà tuyển dụng xem CV hoặc gửi lời mời phỏng vấn.

### 🏢 Dành cho Nhà Tuyển Dụng (Recruiter)
- 🪄 **Tạo JD Siêu Tốc Bằng AI**: Tự động viết và tối ưu hóa Mô tả công việc (Job Description) từ các từ khóa ngắn gọn.
- 🎯 **Hệ Thống Matching Thông Minh**: Background worker tự động rà soát, đánh giá độ phù hợp (matching score) của ứng viên và tự động gửi lời mời ứng tuyển.
- 👥 **Quản Lý Ứng Viên (ATS)**: Kéo thả Kanban board, lưu trữ hồ sơ yêu thích (Saved Candidates) tiện lợi.
- 📊 **Dashboard Thống Kê**: Báo cáo đa chiều về hiệu quả tin đăng, lượt xem, tỷ lệ chuyển đổi.
- 💳 **Thanh Toán Tiện Lợi**: Nạp Credit để đăng tin qua cổng thanh toán QR Code tự động **PayOS**.
- 🔔 **Thông Báo Thời Gian Thực**: Sử dụng thông báo dạng Toast (react-hot-toast) kết hợp Socket.IO cho mọi hoạt động quan trọng.

### 👑 Dành cho Quản trị viên (Admin)
- 🛡️ **Kiểm Duyệt Tự Động (AI Moderation)**: Hệ thống tự động chấm điểm rủi ro (Risk Score) cho các tin tuyển dụng mới để phát hiện spam/lừa đảo.
- 📈 **Quản Lý Hệ Thống Toàn Diện**: Quản lý tài khoản (Recruiter/Candidate), duyệt tin thủ công, quản trị doanh thu.
- 🔔 **Giám Sát Real-time**: Theo dõi hoạt động của hệ thống một cách minh bạch với thông báo theo thời gian thực.

---

## 🛠 Công Nghệ Sử Dụng

Kiến trúc hệ thống mạnh mẽ, linh hoạt và được xây dựng hoàn toàn bằng **TypeScript**:

### 🌍 Web Client (Frontend)
- **Framework**: Next.js 14 (App Router), React 18
- **Styling**: Tailwind CSS v4, Framer Motion (Micro-animations)
- **State Management**: Zustand, React Query
- **UI Components**: Radix UI, Lucide Icons, React Hot Toast (Thông báo hiện đại)
- **Real-time**: Socket.IO Client

### ⚙️ Server (Backend)
- **Framework**: NestJS (Kiến trúc Module hóa, Dependency Injection)
- **Database**: PostgreSQL với **Prisma ORM**
- **AI Engine**: Google Generative AI (Gemini 2.0)
- **Queue & Background Jobs**: Redis + BullMQ (Xử lý tác vụ nặng, gửi mail)
- **WebSockets**: Socket.IO Gateway

### ☁️ Cloud & 3rd Party APIs
- **Storage**: Supabase Storage (Lưu trữ avatar, CV PDF)
- **Payments**: PayOS API
- **Testing**: Playwright (E2E Testing)

---

## 📂 Cấu Trúc Hệ Thống

Dự án được tổ chức theo mô hình **Monorepo**, giúp dễ dàng chia sẻ logic và quản lý code:

```text
Workly-System/
├── server/                     # 🟩 NESTJS BACKEND
│   ├── src/
│   │   ├── modules/            # Domain logic (auth, jobs, ai, admin, ...)
│   │   ├── prisma/             # Lược đồ DB (schema.prisma) & Migrations
│   │   └── main.ts             # Entry point
│   ├── test/                   # Unit & E2E Tests cho Backend
│   └── package.json    
├── web-client/                 # 🟦 NEXTJS FRONTEND
│   ├── app/                    # App Router (Recruiter, Admin, Public...)
│   ├── components/             # Reusable UI Components & Modals
│   ├── lib/                    # Utils, API Client (Axios)
│   ├── stores/                 # Zustand State
│   └── package.json    
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt

### 1. Yêu Cầu Môi Trường
- **Node.js**: Phiên bản `>= 18.17.0`
- **Database**: PostgreSQL (Local hoặc dùng Supabase/NeonDB)
- **Cache/Queue**: Redis (Local hoặc Upstash)

### 2. Cài Đặt Backend (NestJS)

```bash
cd server

# Cài đặt các gói phụ thuộc
npm install

# Khởi tạo biến môi trường
cp .env.example .env
# Mở file .env và cập nhật DATABASE_URL, REDIS_URL, GEMINI_API_KEY...

# Khởi tạo Database Schema
npx prisma generate
npx prisma db push # Hoặc npx prisma migrate dev

# Chạy server
npm run start:dev
# API sẽ chạy tại: http://localhost:3001
```

### 3. Cài Đặt Frontend (Next.js)

```bash
# Mở một Terminal mới
cd web-client

# Cài đặt các gói phụ thuộc
npm install

# Khởi tạo biến môi trường
cp .env.example .env.local
# Mở file .env.local và cập nhật NEXT_PUBLIC_API_URL...

# Chạy web client
npm run dev
# Website sẽ chạy tại: http://localhost:3000
```

---

## 🧪 Kiểm Thử (Testing)

Hệ thống được bảo vệ bởi các bộ test tự động để đảm bảo độ ổn định cao nhất:

- **Unit & Integration Test (Backend)**: Sử dụng Jest.
  ```bash
  cd server && npm run test
  ```
- **End-to-End (E2E) Test**: Sử dụng **Playwright** để kiểm thử toàn bộ luồng người dùng (Đăng nhập, tạo JD, quản lý ứng viên, v.v).
  ```bash
  cd web-client && npx playwright test
  ```

---

## 🚢 Triển Khai (Deployment)

Hệ thống sẵn sàng để đưa lên Production với các nền tảng Cloud hiện đại:

1. **Frontend**: Tối ưu nhất khi deploy trên **[Vercel](https://vercel.com/)**. Cần cung cấp các biến môi trường tại `web-client/.env.production`.
2. **Backend**: Tương thích tốt với các dịch vụ Container/PaaS như **[Render](https://render.com/)**, **Railway**, hoặc VPS (sử dụng PM2/Docker). Tham khảo cấu hình biến môi trường tại `server/.env.production`.
3. **Database**: Khuyến khích sử dụng **Supabase**, **NeonDB** hoặc AWS RDS.

> 💡 *Pro-tip: Cấu hình Redis cẩn thận trên Production để đảm bảo BullMQ xử lý hàng đợi (Background Jobs) ổn định.*
