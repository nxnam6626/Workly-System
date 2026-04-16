<div align="center">

# 📱 Workly Mobile Application

**Ứng dụng điện thoại Tiện dụng Dành Cho Nền Tảng Di Động (iOS & Android)**

![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

</div>

## 📌 Phân khu Mobile
Thư mục `mobile-app/` chứa mã nguồn đa nền tảng (Cross-platform) dành riêng cho App Mobile. Nó biên dịch một mã nguồn thành hai nền tảng Native khổng lồ: **iOS (App Store)** và **Android (Google Play)**.

Ứng dụng nhấn mạnh tính cơ động, hỗ trợ trọn vẹn trải nghiệm của toàn bộ 3 nhóm người dùng trong hệ sinh thái:
- **Ứng viên (Candidate):** Tìm việc, ứng tuyển nhanh chóng từ mọi nơi.
- **Nhà tuyển dụng (Recruiter):** Cập nhật biến động hồ sơ và tin tuyển dụng theo thời gian thực tiện lợi.
- **Quản trị viên (Admin):** Nắm bắt bảng theo dõi doanh thu và cảnh báo hệ thống ngay lập tức qua phiên bản di động bỏ túi.

---

## 🏗 Kiến trúc File (Expo Router)

Ứng dụng sử dụng **Expo Router v6** mang phong cách định tuyến dựa trên Fileside, giống như Next.js của bản thân React Native.

```text
mobile-app/
├── app/                  # Quản lý Routing và Màn hình chính
│   ├── (auth)/           # Màn hình cho khu vực Guest (Đăng ký, đăng nhập)
│   ├── (candidate-tabs)/ # Bottom Navigation Drawer dành cho Ứng viên
│   ├── (recruiter-tabs)/ # Bottom Navigation Drawer dành cho Nhà tuyển dụng
│   └── _layout.tsx       # Root layout của ứng dụng điện thoại
├── components/           # UI Components (Buttons, State Cards, Badges)
├── constants/            # Biến màu sắc, Fonts, Theme theo Design System
├── utils/                # Hàm phụ, Axios Instance (Gọi API)
├── stores/               # Zustand States quản lý giỏ hàng, thông tin User Token
└── app.json              # File cấu hình tên, icon dự án và permission cho ứng dụng bản Build Native
```

---

## ✨ Trải nghiệm Ứng dụng & Tính năng Nổi bật

- **Kiến trúc Layout Cơ Động:** Khai thác sức mạnh của `expo-router` cho khả năng chuyển màn theo cấu trúc cây thư mục cực linh hoạt, hỗ trợ Deep Linking trỏ thẳng từ web vào app.
- **Biểu Đồ Tài Chính Trực Quan (Finance Dashboard):** Tích hợp `react-native-chart-kit` để render các thống kê về chi tiêu của nhà tuyển dụng và độ bao phủ của hồ sơ bằng hiệu ứng bắt mắt ngay trên màn hình chạm.
- **Realtime Push & Socket Connect:** Duy trì chuỗi kết nối WebSocket chạy ngầm chuyên nghiệp không làm tốn Pin, giúp ứng viên và nhà tuyển dụng cập nhật tin nhắn và trạng thái công việc (Pass/Fail) tức thời chưa tới 1 giây.
- **Micro-Animations Mượt Mà:** Kỹ thuật render 60fps sử dụng Native Driver (React Native Reanimated) giúp mọi lần Swipe, Click, Scroll đem lại cảm giác tự nhiên như App Native cấp cao.
- **Tối ưu Khoa học (Size & Storage):** Trọng lượng bundle cài nhỏ nén chặt dưới sự kết hợp của Expo SDK 54, Zustand để cache data an toàn trong Local Security Store, chống mất Data khi tắt App ngang.

---

## 🛠 Hướng dẫn Khởi chạy ở Máy tính

### 1. Chuẩn bị môi trường cài đặt
- Điện thoại của bạn (iOS/Android) cần cài ứng dụng **Expo Go**.
- Hoặc Máy tính của bạn đã có Simulator (iOS Simulator của Xcode hoặc Android Virtual Device của Android Studio).

### 2. Cài gói dependencies
```bash
npm install
```

### 3. Cấu hình biến môi trường (Network)
Với thiết bị Mobile, bạn **không thể** truyền biến thành `localhost` như Web, vì điện thoại sẽ không hiểu `localhost` là chính chiếc laptop của bạn.
Bạn cần cấu hình IP Address của máy tính trong một file tên là `.env`:

```env
# Thay thế dải IP này thành IP IPv4 từ máy bạn (Gõ `ipconfig` ở Terminal để lấy IPv4 nội bộ)
EXPO_PUBLIC_API_URL=http://192.168.1.15:3000

# Hoàn toàn có thể dùng IP thật nếu Backend đã được chạy trực tiếp lên mạng (Render)
# EXPO_PUBLIC_API_URL=https://workly-backend.onrender.com
```

### 4. Phát sóng Ứng dụng
```bash
npm start
```

### 5. Kết nối thiết bị
- **Quét mã QR**: Cầm điện thoại lên, bật ứng dụng **Expo Go** và quét mã QR Code vừa hiện trên Terminal (Command Prompt). App sẽ tự động tải Bundler CSS/JS thẳng vào máy mà không cần cắm cáp.
- **Giả lập**: Gõ phím `a` trên terminal để bật máy ảnh giả lập Android hoặc `i` để bật giả lập iOS.

---

## 📦 Build Bản cài Native (.apk / .ipa)
Để Build ứng dụng xuất File ra phát hành thật, ta dùng hệ thống Expo Application Services (EAS):

```bash
# Đăng nhập Expo Tool
npm install -g eas-cli
eas login

# Xuất ra Android (apk)
eas build -p android --profile preview

# Xuất lên AppStore (Cần chứng chỉ kỹ thuật số sinh của Apple)
eas build -p ios
```
