<div align="center">

# 🌐 Workly Web Client Platform

**Giao diện Trình duyệt Tốc độ cao dành cho Ứng viên & Nhà tuyển dụng**

![Next JS](https://img.shields.io/badge/Next-white?style=for-the-badge&logo=next.js&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

</div>

## 📌 Vai trò của phân hệ
Thư mục `web-client/` chứa mã nguồn cho nền tảng website chạy trên Desktop & Mobile Browser. Nó là điểm tiếp xúc chính giữa người dùng và hệ thống, bao gồm 3 không gian quản lý biệt lập:

1. **Trang Chủ & Ứng viên (Public & Job Seeker)**: Tìm việc, thiết kế CV, quản lý Job Applications.
2. **Khu vực Nhà tuyển dụng (Recruiter Workspace)**: `/recruiter/*` - Môi trường làm việc an toàn của HR để quản lý chiến dịch, thanh toán gói VIP và duyệt hồ sơ.
3. **Control Panel (Super Admin)**: Quản lý tối cao toàn bộ hệ thống.

---

## 🏗 Kiến trúc File (App Router Architecture)

Dự án sử dụng cơ chế **Next.js App Router** thế hệ mới (Next.js v16+).

```text
web-client/
├── app/                  # Toàn bộ Routing (Routes) hoạt động dựa trên cấu trúc thư mục
│   ├── (auth)/           # Route group cho Đăng nhập, Đăng ký (không hiển thị trong URL)
│   ├── recruiter/        # Các tuyến đường dành riêng cho khu vực quản lý của HR
│   ├── jobs/             # Chi tiết công việc
│   ├── globals.css       # File gốc cấu hình CSS cho Tailwind v4
│   └── page.tsx          # Trang chủ / Landing Page
├── components/           # Components React dùng chung, Alert, Layout UI Tái sử dụng
├── lib/                  # Tiện ích, Axios configuration (`api.ts`), Helpers function
├── stores/               # Zustand States quản lý Auth, Wallet, Navigation
├── .env.local            # File bảo mật thiết lập URL gọi sang hệ thống Backend
└── tailwind.config.js    # Cấu hình UI theo Design Tokens chuẩn (Tailwind v4)
```

---

## ✨ Bộ Tính Năng & Trải Nghiệm Lõi

- **Bản Đồ Tìm Việc Thông Minh (Heatmap Job Search):** Tích hợp Leaflet tạo biểu diễn trực tiếp hàng nghìn job quanh khu vực trên nền bản đồ mượt mà (Lazy Rendering).
- **Trải nghiệm UX/UI Chuẩn Xác:** Sử dụng React Hook Form kết hợp Zod Validation cho các form, Framer Motion hỗ trợ Micro-Interaction mang lại cảm giác phản hồi chạm tay xuất sắc.
- **Dynamic AI CV Analyzer:** Đọc tệp PDF trích xuất thông tin, giao tiếp với model NLP để trả về phần trăm tương tự theo JD yêu cầu trước khi ứng tuyển.
- **Khu Vực Phân Tích (Insight Dashboards):** Biểu đồ Chart mạnh mẽ cùng báo cáo tự động tóm gọn số liệu doanh thu hoặc số lượng nộp theo thời gian thông qua Zustand quản lý State nội bộ hiệu quả.
- **Kết nối Thời Giang Thực:** Tính năng Chatbot AI tư vấn nghiệp vụ & Nhắn tin Real-Time với nhà Tuyền Dụng thông qua Socket.io-client.

---

## 🛠 Hướng dẫn phát triển nhanh

### 1. Cài đặt các thư viện phụ thuộc
```bash
npm install
```

### 2. Thiết lập Biến môi trường
Tạo file `.env.local` ở thư mục hiện tại:
```env
# Địa chỉ URL của Backend Server (Chú ý KHÔNG kèm gạch chéo cuối /)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Tuỳ chọn URL Public
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Bật máy chủ giao diện
```bash
npm run dev
```

Truy cập Web trên trình duyệt thông qua: 👉 `http://localhost:3000`

---

## 📦 Build Deployment

Trang này được cấu hình tương thích 100% để Host tự động lên nền tảng **Vercel**. Bạn không cần tinh chỉnh gì thêm, chỉ cần import Github Repo vào Vercel, framework sẽ tự động chọn môi trường là "Next.js".
