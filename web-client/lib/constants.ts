import subVn from "sub-vn";

export const LOCATIONS = subVn
  .getProvinces()
  .map((p: any) => p.name.replace(/^(Thành phố|Tỉnh)\s+/, ""))
  .sort((a: string, b: string) => a.localeCompare(b, "vi"));

export const JOB_TYPES = [
  { value: "FULLTIME", label: "Toàn thời gian" },
  { value: "PARTTIME", label: "Bán thời gian" },
  { value: "INTERNSHIP", label: "Thực tập" },
  { value: "REMOTE", label: "Remote" },
];

export const EXPERIENCE_LEVELS = [
  "Không yêu cầu",
  "Dưới 1 năm",
  "1-3 năm",
  "3-5 năm",
  "Trên 5 năm",
];

export const SALARY_RANGES = [
  { label: "Thỏa thuận", min: 0, max: 0 },
  { label: "Dưới 1 triệu", min: 0, max: 1 },
  { label: "1 - 3 triệu", min: 1, max: 3 },
  { label: "3 - 5 triệu", min: 3, max: 5 },
];

export const HOT_KEYWORDS = [
  "Frontend React",
  "Backend Node.js",
  "Data Science",
  "Product Manager",
  "Mobile Flutter",
  "DevOps",
  "AI Engineer",
];

export const JOB_TYPE_LABEL: Record<string, string> = {
  FULLTIME: "Toàn thời gian",
  PARTTIME: "Bán thời gian",
  INTERNSHIP: "Thực tập",
  REMOTE: "Remote",
};

export const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  'CNTT / IT': [
    'frontend', 'backend', 'software', 'developer', 'mobile', 'react', 'flutter',
    'nodejs', 'java', 'python', 'lập trình', 'công nghệ thông tin',
    'data analyst', 'data science', 'data engineer', 'machine learning', 'ai intern',
  ],
  Marketing: [
    'marketing', 'digital marketing', 'brand', 'thị trường', 'tiếp thị',
  ],
  'Content / SEO': [
    'content', 'copywriter', 'writer', 'seo', 'sem', 'social media',
  ],
  'Tài chính / Kế toán': [
    'accounting', 'kế toán', 'finance', 'tài chính', 'audit', 'kiểm toán', 'banking', 'ngân hàng',
  ],
  'Nhân sự / Hành chính': [
    'hr', 'human resources', 'nhân sự', 'recruiter', 'tuyển dụng', 'admin', 'hành chính', 'legal',
  ],
  'Vận tải / Logistics': [
    'logistics', 'supply chain', 'xuất nhập khẩu', 'import export', 'warehouse', 'kho vận',
  ],
  'Kinh doanh / Bán hàng': [
    'sales', 'kinh doanh', 'telesale', 'business development', 'account executive',
  ],
  'Thiết kế / Sáng tạo': [
    'graphic', 'design', 'ui ux', 'figma', 'video editor', 'fashion', 'animation', 'illustration',
  ],
  'Kỹ thuật / Sản xuất': [
    'mechanical', 'cơ khí', 'electrical', 'điện', 'automation', 'tự động hóa',
    'civil engineering', 'xây dựng', 'qc', 'qa', 'quality control',
  ],
  'Nhà hàng / Khách sạn': [
    'hotel', 'khách sạn', 'tour guide', 'du lịch', 'event', 'f&b', 'nhà hàng',
    'travel consultant', 'tourism',
  ],
  'Giáo dục / Ngôn ngữ': [
    'teaching assistant', 'trợ giảng', 'tutor', 'gia sư', 'educational consultant',
    'tư vấn giáo dục', 'translator', 'interpreter', 'biên dịch', 'phiên dịch',
  ],
};
