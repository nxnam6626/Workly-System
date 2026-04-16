<div align="center">

# 🚀 Workly API Backend (Server)

**Lõi xử lý nghiệp vụ trung tâm của hệ sinh thái Workly**

![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)

</div>

## 📌 Chức năng module & Tính năng nổi bật

Phân hệ `server` là trái tim của hệ thống Workly, chịu trách nhiệm xử lý các tác vụ logic nặng, giao tiếp cơ sở dữ liệu và quản lý Micro-Services nội bộ.

**Các tính năng nổi bật theo Modules:**
- **Auth & IAM**: Cấp phát Token bằng JWT siêu bảo mật. Hỗ trợ Local Login và OAuth (Google/LinkedIn) với bộ Guard Phân quyền RBAC động (Cấp Admin 1-2-3 linh hoạt).
- **Jobs Engine**: Tìm kiếm tin tuyển dụng cực nhanh dựa trên truy vấn địa lý và từ khóa bằng **ElasticSearch**, fallback tự động sang Prisma PosgreSQL.
- **AI Processing**: Module trích xuất CV thông qua `pdfjs-dist` gửi dữ liệu sang Google Gemini phân tích và chấm điểm độ khớp (Match Score) hoàn toàn tự động.
- **PayOS & Wallet Lifecycle**: API tự động Listen Webhook thanh toán trả về để cộng Xu nội bộ, xử lý luồng nạp và mua gói chống kẹt tiền (Race-condition).
- **Messages / Notifications**: Gateway WebSocket đảm nhiệm đẩy notification trạng thái hồ sơ / Chat real-time giữa người với người không độ trễ.

---

## ⚙️ Cấu trúc thư mục

```text
server/
├── prisma/               # Chứa Database Schema chuẩn của dự án (schema.prisma) và file khởi tạo (seed.ts)
├── scripts/              # Các công cụ kiểm thử, script hỗ trợ nhanh
├── src/
│   ├── modules/          # Toàn bộ logic nghiệp vụ, mỗi module là một folder riêng biệt
│   │   ├── ai/           # Service gọi API AI
│   │   ├── auth/         # API Login, Register, JWT Guards
│   │   ├── jobs/         # Controllers và Services xử lý Job, Search
│   │   ├── wallets/      # Integration PayOS và Payment Logic
│   │   └── ...
│   ├── app.module.ts     # Main Root Module
│   └── main.ts           # Điểm khởi chạy của máy chủ Nest
```

---

## 🛠 Hướng dẫn khởi động (Local Development)

### 1. Yêu cầu tiên quyết
- **Node.js** v20+
- **PostgreSQL**: Có một database rỗng sẵn sàng kết nối.
- **Redis Server**: Phải được bật ở cổng `6379`.
- Tùy chọn: **ElasticSearch** (nếu muốn test local search module).

### 2. Thiết lập Biến môi trường
Copy nội dung từ file `.env.example` (nếu có) hoặc tạo file `.env` ở thư mục `server/` với các keyword chính sau:
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/workly"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication
JWT_ACCESS_SECRET="bi-mat-sieucap"
JWT_REFRESH_SECRET="bi-mat-sieucap-2"

# API Keys (Bat buoc de hoat dong)
GEMINI_API_KEY="AIza..."
PAYOS_CLIENT_ID="..."
PAYOS_API_KEY="..."
PAYOS_CHECKSUM_KEY="..."
```

### 3. Khởi tạo Database

```bash
# Cài gói NPM
npm install

# Đồng bộ Schema với PostgreSQL Database
npx prisma generate
npx prisma db push

# Kích hoạt dữ liệu gốc (Tạo data mẫu và Role ban đầu nếu cần)
npm run prisma:seed
```

### 4. Bật máy chủ phát triển
```bash
npm run start:dev
```
Máy chủ API sẽ bắt đầu lắng nghe tại cổng `3000` theo cấu hình mặc định.

### 5. Khám phá API (Swagger)
Khi Server đang chạy, bạn hãy mở trình duyệt và truy cập:
👉 `http://localhost:3000/api`

Giao diện **Swagger UI** sẽ hiện lên cho phép bạn xem tài liệu, test các Endpoint của RESTful API.
