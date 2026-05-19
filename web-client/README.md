<div align="center">

# 🌐 Workly Web Client

**Giao diện Web Hiện đại dành cho Ứng viên, Nhà tuyển dụng & Admin**

![Next JS](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

</div>

## 📌 Vai trò của phân hệ

Thư mục `web-client/` chứa mã nguồn Frontend cho toàn bộ nền tảng Workly. Đây là điểm tiếp xúc chính giữa người dùng và hệ thống, bao gồm 3 phân hệ chính:

1. **Ứng viên (Candidate & Public)**: Tìm việc, xem chi tiết công việc, tạo CV và ứng tuyển.
2. **Nhà tuyển dụng (Recruiter Dashboard)**: Giao diện an toàn cho HR để quản lý chiến dịch, duyệt hồ sơ, nạp credit, tạo JD tự động bằng AI.
3. **Quản trị viên (Admin Dashboard)**: Bảng điều khiển tối cao để quản lý user, phê duyệt tin đăng, giám sát hệ thống.

---

## 🏗 Kiến trúc File (App Router)

Dự án sử dụng cơ chế **Next.js App Router (v14)**:

```text
web-client/
├── app/                  # Hệ thống Routing
│   ├── (auth)/           # Route group cho Đăng nhập/Đăng ký
│   ├── admin/            # Dashboard dành riêng cho Admin
│   ├── recruiter/        # Dashboard dành riêng cho Nhà tuyển dụng
│   ├── (public)/         # Khu vực Public (Trang chủ, Chi tiết Job,...)
│   ├── globals.css       # File gốc cấu hình CSS cho Tailwind v4
│   └── layout.tsx        # Root layout (ToastProvider, ReactQuery,...)
├── components/           # Reusable UI Components
│   ├── ui/               # Radix UI / Shadcn base components
│   ├── recruiter/        # Components riêng cho Recruiter (Modals, Forms)
│   └── admin/            # Components riêng cho Admin
├── lib/                  # Tiện ích, Axios client (`api.ts`), Hooks
├── stores/               # Zustand States quản lý Auth, UI state
├── tests/                # E2E Tests (Playwright)
├── .env.local            # Biến môi trường local
└── tailwind.config.ts    # Cấu hình UI theo Design Tokens chuẩn (Tailwind v4)
```

---

## ✨ Điểm Nhấn Công Nghệ & UX/UI

- **Trải Nghiệm Mượt Mà (Micro-Interactions)**: Sử dụng **Framer Motion** mang lại các hiệu ứng chuyển cảnh mềm mại và **React Hot Toast** để hiển thị thông báo thay vì `alert()` mặc định.
- **Form Xử Lý Chuyên Nghiệp**: Quản lý form bằng **React Hook Form** kết hợp **Zod** để xác thực dữ liệu chặt chẽ ở phía client trước khi gửi lên server.
- **Tối Ưu Hóa Trạng Thái**: Quản lý global state cực nhẹ với **Zustand** và handle caching, server state bằng **React Query**.
- **Real-time Updates**: Tích hợp **Socket.IO Client** nhận thông báo ngay lập tức khi có hồ sơ mới, tin duyệt thành công, hay tin nhắn.
- **E2E Testing (Playwright)**: Đảm bảo luồng người dùng (Login, Post Job, Change Status) luôn hoạt động ổn định nhờ bộ test tự động.

---

## 🛠 Hướng dẫn khởi chạy

### 1. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 2. Thiết lập Biến môi trường
Copy file `.env.example` thành `.env.local` (nếu chưa có) và cập nhật URL trỏ về Backend:
```env
# Địa chỉ URL của Backend Server (Cổng 3001)
NEXT_PUBLIC_API_URL=http://localhost:3001

# URL của chính Frontend
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Bật máy chủ phát triển
```bash
npm run dev
```
Truy cập Web trên trình duyệt thông qua: 👉 `http://localhost:3000`

---

## 🧪 Chạy Kiểm Thử (E2E Tests)

Để chạy kiểm thử Playwright cho Frontend:
```bash
# Chạy ở chế độ nền
npx playwright test

# Chạy có hiển thị giao diện browser (UI Mode)
npx playwright test --ui
```

---

## 📦 Triển Khai (Deployment)

Dự án Frontend này tương thích 100% để deploy trực tiếp lên **Vercel** - nền tảng tối ưu nhất cho Next.js.
- Cài đặt Biến môi trường trên Vercel: `NEXT_PUBLIC_API_URL` trỏ về API Backend (VD: Render hoặc Railway).
- Mọi tối ưu hoá hình ảnh, cache, Edge API đều được Vercel tự động xử lý.
