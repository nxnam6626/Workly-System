import { VIETNAM_LOCATIONS } from "./locations";

// Danh sách tỉnh thành chuẩn hóa - lấy từ thư viện sub-vn
export const LOCATIONS = VIETNAM_LOCATIONS.map(p => p.name);

export const JOB_TYPES = [
  { value: "FULLTIME", label: "Toàn thời gian" },
  { value: "PARTTIME", label: "Bán thời gian" },
  { value: "REMOTE", label: "Làm việc từ xa" },
];

export const EXPERIENCE_LEVELS = [
  "Không yêu cầu",
  "Dưới 1 năm",
  "1 - 2 năm",
  "2 - 3 năm",
  "3 - 5 năm",
  "Trên 5 năm",
];

export const JOB_LEVELS = [
  { value: "INTERN", label: "Thực tập sinh" },
  { value: "STAFF", label: "Nhân viên/Chuyên viên" },
  { value: "MANAGER", label: "Trưởng nhóm/Trưởng phòng" },
  { value: "DIRECTOR", label: "Giám đốc/Cấp cao hơn" },
];

// Mức lương thực tế thị trường VN (triệu VNĐ)
export const SALARY_RANGES = [
  { label: "Tất cả mức lương", min: undefined, max: undefined },
  { label: "Dưới 5 triệu", min: 0, max: 5_000_000 },
  { label: "5 - 10 triệu", min: 5_000_000, max: 10_000_000 },
  { label: "10 - 15 triệu", min: 10_000_000, max: 15_000_000 },
  { label: "15 - 20 triệu", min: 15_000_000, max: 20_000_000 },
  { label: "20 - 30 triệu", min: 20_000_000, max: 30_000_000 },
  { label: "30 - 50 triệu", min: 30_000_000, max: 50_000_000 },
  { label: "Trên 50 triệu", min: 50_000_000, max: 999_000_000 },
];

export const HOT_KEYWORDS = [
  "Frontend React",
  "Backend Node.js",
  "Data Science",
  "Product Manager",
  "Mobile Flutter",
  "DevOps AWS",
  "AI Engineer",
  "Kế toán tổng hợp",
  "Kinh doanh B2B",
  "UI/UX Designer",
];

export const JOB_TYPE_LABEL: Record<string, string> = {
  FULLTIME: "Toàn thời gian",
  PARTTIME: "Bán thời gian",
  REMOTE: "Làm việc từ xa",
};

export const JOB_LEVEL_LABEL: Record<string, string> = {
  INTERN: "Thực tập sinh",
  STAFF: "Nhân viên/Chuyên viên",
  MANAGER: "Trưởng nhóm/Trưởng phòng",
  DIRECTOR: "Giám đốc/Cấp cao hơn",
};

// Danh sách ngành nghề chuẩn (dùng cho dropdown)
export const INDUSTRIES = [
  "CNTT / Phần mềm",
  "Marketing / Truyền thông",
  "Content / SEO",
  "Tài chính / Kế toán / Ngân hàng",
  "Nhân sự / Hành chính / Pháp lý",
  "Kinh doanh / Bán hàng",
  "Thiết kế / Sáng tạo",
  "Kỹ thuật / Cơ khí / Sản xuất",
  "Xây dựng / Kiến trúc",
  "Vận tải / Logistics / Chuỗi cung ứng",
  "Bán lẻ / Tiêu dùng",
  "Nhà hàng / Khách sạn / Du lịch",
  "Y tế / Dược phẩm / Chăm sóc sức khỏe",
  "Giáo dục / Đào tạo / Ngôn ngữ",
  "Nông nghiệp / Môi trường",
  "Bất động sản",
  "Truyền thông / Báo chí",
  "Thể thao / Làm đẹp / Giải trí",
];

// Tag mapping để AI/search hiểu ngành nghề theo từ khóa trong JD
export const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  "CNTT / Phần mềm": [
    "frontend", "backend", "software", "developer", "mobile", "react", "flutter",
    "nodejs", "java", "python", "lập trình", "công nghệ thông tin", "it", "devops",
    "data analyst", "data science", "data engineer", "machine learning", "ai", "llm",
    "cloud", "aws", "azure", "kubernetes", "docker", "golang", "typescript", "fullstack",
    "qa engineer", "tester", "kiểm thử phần mềm", "product owner", "scrum master",
  ],
  "Marketing / Truyền thông": [
    "marketing", "digital marketing", "brand", "thị trường", "tiếp thị",
    "performance marketing", "google ads", "facebook ads", "campaign",
    "growth hacker", "crm marketing", "trade marketing",
  ],
  "Content / SEO": [
    "content", "copywriter", "writer", "seo", "sem", "social media",
    "content creator", "blog", "editor", "video script", "social media manager",
  ],
  "Tài chính / Kế toán / Ngân hàng": [
    "accounting", "kế toán", "finance", "tài chính", "audit", "kiểm toán",
    "banking", "ngân hàng", "treasurer", "tax", "thuế", "cfo", "controller",
    "financial analyst", "investment", "chứng khoán",
  ],
  "Nhân sự / Hành chính / Pháp lý": [
    "hr", "human resources", "nhân sự", "recruiter", "tuyển dụng",
    "admin", "hành chính", "legal", "pháp lý", "compliance", "c&b",
    "labor relations", "training", "organizational development",
  ],
  "Kinh doanh / Bán hàng": [
    "sales", "kinh doanh", "telesale", "business development", "account executive",
    "b2b", "b2c", "key account", "bán hàng", "kd", "rm", "relationship manager",
  ],
  "Thiết kế / Sáng tạo": [
    "graphic", "design", "ui ux", "figma", "adobe", "video editor", "animation",
    "illustration", "motion graphic", "creative director", "art director",
    "3d", "branding", "visual design",
  ],
  "Kỹ thuật / Cơ khí / Sản xuất": [
    "mechanical", "cơ khí", "electrical", "điện", "automation", "tự động hóa",
    "qc", "qa", "quality control", "sản xuất", "manufacturing", "cnc",
    "plc", "mold", "khuôn", "bảo trì", "maintenance",
  ],
  "Xây dựng / Kiến trúc": [
    "civil engineering", "xây dựng", "kiến trúc sư", "kết cấu", "mep",
    "site engineer", "project engineer", "construction", "bim", "autocad",
  ],
  "Vận tải / Logistics / Chuỗi cung ứng": [
    "logistics", "supply chain", "xuất nhập khẩu", "import export",
    "warehouse", "kho vận", "trucking", "freight", "forwarder", "customs",
    "procurement", "mua hàng",
  ],
  "Bán lẻ / Tiêu dùng": [
    "retail", "bán lẻ", "store manager", "visual merchandising",
    "category manager", "fmcg", "consumer goods", "siêu thị",
  ],
  "Nhà hàng / Khách sạn / Du lịch": [
    "hotel", "khách sạn", "tour guide", "du lịch", "event", "f&b", "nhà hàng",
    "travel consultant", "tourism", "hospitality", "chef", "phục vụ",
  ],
  "Y tế / Dược phẩm / Chăm sóc sức khỏe": [
    "medical", "y tế", "bác sĩ", "dược", "pharma", "điều dưỡng", "nurse",
    "healthcare", "clinical", "lab", "xét nghiệm", "spa", "chăm sóc sức khỏe",
  ],
  "Giáo dục / Đào tạo / Ngôn ngữ": [
    "teaching assistant", "trợ giảng", "tutor", "gia sư", "educational consultant",
    "tư vấn giáo dục", "translator", "interpreter", "biên dịch", "phiên dịch",
    "teacher", "giáo viên", "lecturer", "e-learning", "training",
  ],
  "Nông nghiệp / Môi trường": [
    "agriculture", "nông nghiệp", "environment", "môi trường", "agri",
    "food technology", "công nghệ thực phẩm", "aquaculture", "thủy sản",
  ],
  "Bất động sản": [
    "real estate", "bất động sản", "property", "leasing", "cho thuê",
    "môi giới", "broker", "land", "đất", "chung cư",
  ],
  "Truyền thông / Báo chí": [
    "journalist", "báo chí", "pr", "public relations", "media",
    "news", "broadcast", "radio", "television",
  ],
  "Thể thao / Làm đẹp / Giải trí": [
    "beauty", "làm đẹp", "spa", "nail", "fitness", "yoga", "gym",
    "entertainment", "game", "esports", "event organizer",
  ],
};

