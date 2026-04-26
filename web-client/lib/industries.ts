export interface IndustryItem {
  category: string;
  subCategories: string[];
}

export const HIERARCHICAL_INDUSTRIES: IndustryItem[] = [
  {
    category: "Kinh Doanh / Bán Hàng",
    subCategories: [
      "Bán Hàng Doanh Nghiệp (B2B)",
      "Bán Hàng Cá Nhân (B2C)",
      "Telesales / Bán Hàng Online",
      "Phát Triển Kinh Doanh",
      "Quản Lý Đại Lý / Kênh Phân Phối",
      "Sales Admin / Hỗ Trợ Kinh Doanh",
      "Bán Hàng Kỹ Thuật",
      "Bán Hàng Bất Động Sản",
      "Bán Hàng Bảo Hiểm / Tài Chính"
    ]
  },
  {
    category: "Công Nghệ Thông Tin",
    subCategories: [
      "Lập Trình Phần Mềm (Frontend/Backend)",
      "Lập Trình Di Động (iOS/Android)",
      "Dữ Liệu & AI (Big Data/Machine Learning)",
      "An Toàn Thông Tin / Cyber Security",
      "Quản Lý Dự Án IT (PM/PO/BA)",
      "Kiểm Thử Phần Mềm (QC/QA/Tester)",
      "Hạ Tầng / Mạng / Cloud",
      "Vận Hành IT / Helpdesk",
      "DevOps / SRE"
    ]
  },
  {
    category: "Marketing / Truyền Thông",
    subCategories: [
      "Digital Marketing",
      "Quản Lý Thương Hiệu (Brand)",
      "Nghiên Cứu Thị Trường",
      "Trade Marketing",
      "PR / Truyền Thông / Tổ Chức Sự Kiện",
      "SEO / SEM / Google Ads",
      "Performance Marketing",
      "Marketing Tổng Hợp"
    ]
  },
  {
    category: "Content / SEO",
    subCategories: [
      "Sáng Tạo Nội Dung (Copywriter)",
      "Sản Xuất Video / TikTok / YouTube",
      "Quản Lý Fanpage / Social Media",
      "Chuyên Viên SEO",
      "Biên Tập Viên / Báo Chí",
      "Thiết Kế Nội Dung"
    ]
  },
  {
    category: "Tài Chính / Kế Toán / Ngân Hàng",
    subCategories: [
      "Kế Toán Tổng Hợp",
      "Kế Toán Thuế / Kiểm Toán",
      "Kế Toán Nội Bộ / Kho",
      "Phân Tích Tài Chính",
      "Ngân Hàng (Tín Dụng / Giao Dịch Viên)",
      "Chứng Khoán / Đầu Tư",
      "Quản Lý Quỹ"
    ]
  },
  {
    category: "Nhân Sự / Hành Chính / Pháp Lý",
    subCategories: [
      "Tuyển Dụng (Recruiter / Headhunt)",
      "C&B / Quản Trị Nhân Sự",
      "Đào Tạo & Phát Triển (L&D)",
      "Hành Chính Văn Phòng / Lễ Tân",
      "Thư Ký / Trợ Lý Giám Đốc",
      "Pháp Chế Doanh Nghiệp / Luật Sư",
      "Quản Lý Tòa Nhà"
    ]
  },
  {
    category: "Thiết Kế / Sáng Tạo",
    subCategories: [
      "Thiết Kế Đồ Họa (2D/3D)",
      "Thiết Kế UI/UX",
      "Chỉnh Sửa Video (Motion Graphic)",
      "Thiết Kế Nội Thất / Kiến Trúc",
      "Nhiếp Ảnh / Quay Phim",
      "Sáng Tạo Ý Tưởng (Creative)"
    ]
  },
  {
    category: "Kỹ Thuật / Cơ Khí / Sản Xuất",
    subCategories: [
      "Bảo Trì / Sửa Chữa Máy Móc",
      "Điện / Điện Tử / Điện Lạnh",
      "Cơ Khí / Chế Tạo Máy",
      "Tự Động Hóa (PLC/SCADA)",
      "Quản Lý Sản Xuất / Quản Đốc",
      "Vận Hành Máy / QC Sản Xuất"
    ]
  },
  {
    category: "Xây Dựng / Kiến Trúc",
    subCategories: [
      "Kỹ Sư Xây Dựng / Kết Cấu",
      "Giám Sát Công Trình",
      "Kiến Trúc Sư",
      "Thiết Kế Nội Thất",
      "Quản Lý Dự Án Xây Dựng",
      "Đấu Thầu / QS"
    ]
  },
  {
    category: "Vận Tải / Logistics",
    subCategories: [
      "Xuất Nhập Khẩu / Forwarder",
      "Quản Lý Kho Bãi / Thu mua",
      "Điều Phối Vận Tải / Giao Nhận",
      "Khai Báo Hải Quan",
      "Chuỗi Cung Ứng (Supply Chain)",
      "Lái Xe / Giao Hàng"
    ]
  },
  {
    category: "Bán Lẻ / Tiêu Dùng",
    subCategories: [
      "Quản Lý Cửa Hàng / Siêu Thị",
      "Tư Vấn Bán Hàng / Thu Ngân",
      "Trưng Bày Hàng Hóa (VM)",
      "Quản Lý Ngành Hàng",
      "Chăm Sóc Khách Hàng"
    ]
  },
  {
    category: "Nhà Hàng / Khách Sạn / Du lịch",
    subCategories: [
      "Quản Lý Nhà Hàng / Khách Sạn",
      "Đầu Bếp / Phụ Bếp",
      "Pha Chế (Bartender/Barista)",
      "Lễ Tân / Buồng Phòng",
      "Hướng Dẫn Viên Du Lịch",
      "Điều Hành Tour"
    ]
  },
  {
    category: "Y Tế / Dược Phẩm",
    subCategories: [
      "Bác Sĩ / Điều Dưỡng",
      "Dược Sĩ / Trình Dược Viên",
      "Xét Nghiệm / Chẩn Đoán Hình Ảnh",
      "Quản Lý Bệnh Viện",
      "Chăm Sóc Sức Khỏe Tại Nhà"
    ]
  },
  {
    category: "Giáo Dục / Đào Tạo",
    subCategories: [
      "Giáo Viên / Giảng Viên",
      "Gia Sư / Trợ Giảng",
      "Tư Vấn Giáo Duyệt / Tuyển Sinh",
      "Đào Tạo Nội Bộ",
      "Biên Dịch / Phiên Dịch",
      "E-Learning"
    ]
  },
  {
    category: "Nông Nghiệp / Môi Trường",
    subCategories: [
      "Kỹ Thuật Cây Trồng / Vật Nuôi",
      "Thủy Sản / Thức Ăn Chăn Nuôi",
      "Công Nghệ Thực Phẩm",
      "Quản Lý Môi Trường",
      "Năng Lượng Tái Tạo"
    ]
  },
  {
    category: "Bất Động Sản",
    subCategories: [
      "Môi Giới Bất Động Sản",
      "Đầu Tư / Phát Triển Dự Án",
      "Thẩm Định Giá",
      "Quản Lý Tài Sản",
      "Kinh Doanh Căn Hộ / Mặt Bằng"
    ]
  },
  {
    category: "Truyền Thông / Báo Chí",
    subCategories: [
      "Phóng Viên / Nhà Báo",
      "Biên Tập Nội Dung",
      "Sản Xuất Chương Trình",
      "Quan Hệ Công Chúng (PR)",
      "Phát Thanh / Truyền Hình"
    ]
  },
  {
    category: "Thể Thao / Làm Đẹp / Giải Trí",
    subCategories: [
      "Huấn Luyện Viên (Gym/Yoga)",
      "Chuyên Viên Spa / Massage",
      "Làm Tóc / Trang Điểm",
      "Tổ Chức Sự Kiện Giải Trí",
      "Game / Esports"
    ]
  },
  {
    category: "Luật / Tư Vấn Pháp Lý",
    subCategories: [
      "Luật Sư / Trợ Lý Luật",
      "Tư Vấn Pháp Lý Doanh Nghiệp",
      "Thừa Phát Lại / Công Chứng",
      "Sở Hữu Trí Tuệ"
    ]
  },
  {
    category: "Dệt May / Da Giày",
    subCategories: [
      "Thiết Kế Thời Trang",
      "Quản Lý May Công Nghiệp",
      "Kỹ Thuật Chuyền May",
      "Kiểm Soát Chất Lượng (QA/QC)"
    ]
  },
  {
    category: "Thực Phẩm & Đồ Uống (F&B)",
    subCategories: [
      "Phát Triển Sản Phẩm (R&D)",
      "Kiểm Định Thực Phẩm",
      "Quản Lý Chuỗi Nhà Hàng",
      "Kinh Doanh Thực Phẩm"
    ]
  },
  {
    category: "Viễn Thông",
    subCategories: [
      "Kỹ Thuật Viễn Thông",
      "Phát Triển Hạ Tầng Mạng",
      "Kinh Doanh Dịch Vụ Viễn Thông",
      "Chăm Sóc Khách Hàng Viễn Thông"
    ]
  },
  {
    category: "Bảo Hiểm",
    subCategories: [
      "Tư Vấn Bảo Hiểm Nhân Thọ",
      "Bảo Hiểm Phi Nhân Thọ",
      "Giám Định Bồi Thường",
      "Quản Lý Nhóm Kinh Doanh"
    ]
  },
  {
    category: "Điện / Điện Tử / Điện Lạnh",
    subCategories: [
      "Kỹ Thuật Điện Công Nghiệp",
      "Lắp Đặt Điện Lạnh",
      "Thiết Kế Mạch Điện Tử",
      "Sửa Chữa Đồ Gia Dụng"
    ]
  },
  {
    category: "Hóa Học / Sinh Học",
    subCategories: [
      "Kỹ Thuật Hóa Học",
      "Công Nghệ Sinh Học",
      "Phòng Thí Nghiệm (Lab)",
      "Sản Xuất Mỹ Phẩm / Hóa Chất"
    ]
  },
  {
    category: "Thời Trang / Mỹ Phẩm",
    subCategories: [
      "Tư Vấn Thời Trang / Stylist",
      "Kinh Doanh Mỹ Phẩm",
      "Quản Lý Cửa Hàng Thời Trang",
      "Người Mẫu / KOLs"
    ]
  },
  {
    category: "Cơ Khí / Chế Tạo Máy",
    subCategories: [
      "Vận Hành Máy CNC",
      "Hàn / Tiện / Phay",
      "Thiết Kế Cơ Khí (Solidworks/AutoCAD)",
      "Sửa Chữa Ô Tô / Xe Máy"
    ]
  },
  {
    category: "Xuất Nhập Khẩu",
    subCategories: [
      "Chứng Từ Xuất Nhập Khẩu",
      "Hiện Trường (Ops)",
      "Thanh Toán Quốc Tế",
      "Kinh Doanh Cước (Sales Logistics)"
    ]
  },
  {
    category: "Thẩm Mỹ / Spa / Massage",
    subCategories: [
      "Kỹ Thuật Viên Spa",
      "Quản Lý Trung Tâm Thẩm Mỹ",
      "Tư Vấn Làm Đẹp",
      "Chăm Sóc Da / Body"
    ]
  },
  {
    category: "Bảo Vệ / An Ninh",
    subCategories: [
      "Nhân Viên Bảo Vệ",
      "Chỉ Huy Mục Tiêu",
      "Vệ Sĩ Chuyên Nghiệp",
      "An Ninh Tòa Nhà / Khách Sạn"
    ]
  },
  {
    category: "Lao Động Phổ Thông",
    subCategories: [
      "Công Nhân Nhà Máy",
      "Nhân Viên Đóng Gói",
      "Phụ Kho / Bốc Xếp",
      "Nhân Viên Vệ Sinh",
      "Giúp Việc / Tạp Vụ"
    ]
  },
  {
    category: "Freelance / Việc Làm Tự Do",
    subCategories: [
      "Cộng Tác Viên Bán Hàng",
      "Freelance Content / Design",
      "Gia Sư Tự Do",
      "Dịch Thuật Tự Do"
    ]
  }
];

export const INDUSTRIES_DATA = HIERARCHICAL_INDUSTRIES;
