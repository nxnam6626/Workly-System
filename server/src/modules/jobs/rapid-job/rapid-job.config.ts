/**
 * ============================================================
 *  RAPID JOB - KEYWORD ROTATION CONFIG
 *  Chiến lược "Phủ rộng - Đào sâu" cho 9 khối ngành của Workly
 * ============================================================
 *
 * Nguyên tắc phân công:
 *  - JSearch  (200 req/tháng) : 6 queries/ngày, xoay vòng theo thứ trong tuần
 *  - LinkedIn (30  req/tháng) : 1 query /ngày, xoay vòng title theo thứ
 *  - JPF      (5   req/tháng) : 1 req   /tuần (Chủ Nhật), dùng advanced_title_filter
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JSearchQuery {
  /** Từ khóa gửi vào API */
  query: string;
  /** Nhãn nội bộ để log & tagging */
  label: string;
}

export interface JSearchDailyPlan {
  /** Mô tả chủ đề của ngày */
  theme: string;
  /** Danh sách 6 query (khớp với 6 request/ngày) */
  queries: JSearchQuery[];
}

// ─── JSearch Weekly Schedule (6 req/ngày × 7 ngày) ──────────────────────────
//
//  - Key: 0 = CN, 1 = T2, 2 = T3, 3 = T4, 4 = T5, 5 = T6, 6 = T7
//  - Mỗi ngày: 2 req Tổng hợp (EN+VI) + 2 req Ngành A (EN+VI) + 2 req Ngành B (EN+VI)
//  - Chủ Nhật: location-based 3 req Hà Nội + 3 req HCM (dự phòng)
//  - Kết hợp tiếng Anh & tiếng Việt cho độ phủ tốt nhất

export const JSEARCH_WEEKLY_SCHEDULE: Record<number, JSearchDailyPlan> = {
  // ── Thứ 2: IT & Sáng tạo (UI/UX) ──────────────────────────────────────
  1: {
    theme: 'IT & Sáng tạo (UI/UX)',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh công nghệ thông tin Việt Nam', label: 'General-VI' },
      // 2 req IT (Frontend + Backend)
      { query: 'frontend backend software developer intern Vietnam', label: 'IT-Dev-EN' },
      { query: 'thực tập lập trình viên frontend backend Vietnam', label: 'IT-Dev-VI' },
      // 2 req UI/UX
      { query: 'UI UX designer product design intern Vietnam', label: 'Creative-UIUX-EN' },
      { query: 'thực tập thiết kế UI UX sản phẩm Vietnam', label: 'Creative-UIUX-VI' },
    ],
  },

  // ── Thứ 3: Kinh tế & Sale ──────────────────────────────────────────────
  2: {
    theme: 'Kinh tế & Sales',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh kinh tế kinh doanh Việt Nam', label: 'General-VI' },
      // 2 req Marketing
      { query: 'marketing intern brand communications Vietnam', label: 'Marketing-EN' },
      { query: 'thực tập marketing tiếp thị truyền thông Vietnam', label: 'Marketing-VI' },
      // 2 req Sales
      { query: 'sales intern business development account executive Vietnam', label: 'Sales-EN' },
      { query: 'thực tập kinh doanh bán hàng sales Vietnam', label: 'Sales-VI' },
    ],
  },

  // ── Thứ 4: Tài chính & Nhân sự ─────────────────────────────────────────
  3: {
    theme: 'Tài chính & Nhân sự',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh tài chính nhân sự Việt Nam', label: 'General-VI' },
      // 2 req Finance (Kế toán, Kiểm toán, Banking)
      { query: 'accounting finance audit banking intern Vietnam', label: 'Finance-EN' },
      { query: 'thực tập kế toán tài chính kiểm toán ngân hàng Vietnam', label: 'Finance-VI' },
      // 2 req HR (Nhân sự, Hành chính, Pháp lý)
      { query: 'HR human resources recruiter admin legal intern Vietnam', label: 'HR-EN' },
      { query: 'thực tập nhân sự hành chính tuyển dụng pháp lý Vietnam', label: 'HR-VI' },
    ],
  },

  // ── Thứ 5: IT & Logistics ───────────────────────────────────────────────
  4: {
    theme: 'IT & Logistics',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh công nghệ logistics Việt Nam', label: 'General-VI' },
      // 2 req IT (Data & Mobile focus — khác T2 để tối đa coverage)
      { query: 'data analyst mobile developer intern Vietnam', label: 'IT-Data-Mobile-EN' },
      { query: 'thực tập data analyst lập trình mobile Vietnam', label: 'IT-Data-Mobile-VI' },
      // 2 req Logistics (Supply Chain, XNK, Sales)
      { query: 'logistics supply chain import export warehouse intern Vietnam', label: 'Logistics-EN' },
      { query: 'thực tập logistics xuất nhập khẩu chuỗi cung ứng Vietnam', label: 'Logistics-VI' },
    ],
  },

  // ── Thứ 6: Kinh tế & Sale (Digital Marketing focus) ────────────────────
  5: {
    theme: 'Kinh tế & Sale (Digital Marketing)',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh marketing kinh doanh Việt Nam', label: 'General-VI' },
      // 2 req Digital Marketing (SEO, Content, Social Media)
      { query: 'digital marketing SEO SEM content creator intern Vietnam', label: 'DigitalMarketing-EN' },
      { query: 'thực tập digital marketing SEO content creator Vietnam', label: 'DigitalMarketing-VI' },
      // 2 req Sale (Telesale, Online Sales)
      { query: 'sales telesale account executive intern Vietnam', label: 'Sales-Tele-EN' },
      { query: 'thực tập bán hàng telesales kinh doanh Vietnam', label: 'Sales-Tele-VI' },
    ],
  },

  // ── Thứ 7: Sáng tạo & Nhân sự (Admin) ─────────────────────────────────
  6: {
    theme: 'Sáng tạo & Nhân sự (Admin)',
    queries: [
      // 2 req Tổng hợp
      { query: 'internship Vietnam', label: 'General-EN' },
      { query: 'thực tập sinh sáng tạo hành chính Việt Nam', label: 'General-VI' },
      // 2 req Graphic Design (Đồ họa, Video, Fashion)
      { query: 'graphic designer video editor fashion design intern Vietnam', label: 'Creative-Design-EN' },
      { query: 'thực tập thiết kế đồ họa video editor Vietnam', label: 'Creative-Design-VI' },
      // 2 req Admin/HR (Office, Hành chính, Pháp lý)
      { query: 'admin office manager recruiter legal management trainee intern Vietnam', label: 'HR-Admin-EN' },
      { query: 'thực tập hành chính văn phòng nhân sự pháp lý Vietnam', label: 'HR-Admin-VI' },
    ],
  },

  // ── Chủ Nhật: Dự phòng theo Địa điểm (3 Hà Nội + 3 HCM) ────────────────
  //  Quét tin theo location, bổ sung coverage các tỉnh thành lớn
  0: {
    theme: 'Dự phòng / Địa điểm (Hà Nội & HCM)',
    queries: [
      // 3 req Hà Nội
      { query: 'internship Hanoi Ha Noi', label: 'HaNoi-General' },
      { query: 'software engineer marketing intern Hanoi', label: 'HaNoi-Tech-Marketing' },
      { query: 'thực tập kế toán nhân sự hành chính Hà Nội', label: 'HaNoi-Finance-HR' },
      // 3 req TP. Hồ Chí Minh
      { query: 'internship Ho Chi Minh City HCMC', label: 'HCM-General' },
      { query: 'software engineer marketing intern Ho Chi Minh', label: 'HCM-Tech-Marketing' },
      { query: 'thực tập kế toán nhân sự hành chính Hồ Chí Minh', label: 'HCM-Finance-HR' },
    ],
  },
};

// ─── LinkedIn Letscrape (25 req/tháng) ───────────────────────────────────────
// Chỉ chạy từ Thứ 2 đến Thứ 7. Chủ nhật trả về null để Skip.
export const LINKEDIN_LETSCRAPE_SCHEDULE: Record<number, string | null> = {
  1: 'Software Engineer Intern',       // Thứ 2
  2: 'Marketing Trainee Intern',       // Thứ 3
  3: 'Accounting Finance Intern',      // Thứ 4
  4: 'Data Analyst Intern',            // Thứ 5
  5: 'Business Development Intern',    // Thứ 6
  6: 'Management Trainee Intern',      // Thứ 7
  0: null,                             // Chủ nhật nghỉ để tiết kiệm quota
};

// ─── LinkedIn Fantastic (5 req/tháng) ────────────────────────────────────────
// Chỉ chạy 1 lần vào Thứ 2 đầu tuần
export const LINKEDIN_BULK_QUERY = 'Internship | "Thực tập"';
export const LINKEDIN_BULK_LIMIT = 100;

// ─── Job Posting Feed - Advanced Title Filter (1 req/tuần, Chủ Nhật) ─────────
//
//  JPF hỗ trợ boolean syntax: & (AND), | (OR), " " (phrase)
//  Tập trung vào các ngành kỹ thuật / dịch vụ / giáo dục vì:
//   - Ít cạnh tranh từ JSearch (JSearch đã cover IT/Marketing tốt hơn)
//   - Tin thường đăng lâu hơn (14+ ngày) → JPF weekly là phù hợp

export const JPF_TITLE_FILTER =
  '(Intern | Internship | "Thực tập") & ' +
  '(Mechanical | Electrical | Automation | "Civil Engineering" | "QC" | "QA" | ' +
  '"Hotel" | "Tour Guide" | "Event Coordinator" | "F&B" | "Travel Consultant" | ' +
  '"Teaching Assistant" | "Tutor" | "Educational Consultant" | "Translator" | "Interpreter")';

// ─── Industry Tagging Map ────────────────────────────────────────────────────
//
//  Dùng để phân loại tự động nhãn ngành khi lưu vào DB.
//  Logic: kiểm tra lowercase(title) xem chứa keyword nào trong mảng

export const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  IT: [
    'frontend', 'backend', 'software', 'developer', 'mobile', 'react', 'flutter',
    'nodejs', 'java', 'python', 'lập trình', 'công nghệ thông tin',
    'data analyst', 'data science', 'data engineer', 'machine learning', 'ai intern',
  ],

  Marketing: [
    'marketing', 'digital marketing', 'brand', 'thị trường', 'tiếp thị',
    'content', 'copywriter', 'writer', 'seo', 'sem', 'social media',
  ],
  Finance: [
    'accounting', 'kế toán', 'finance', 'tài chính', 'audit', 'kiểm toán', 'banking', 'ngân hàng',
  ],
  HR: [
    'hr', 'human resources', 'nhân sự', 'recruiter', 'tuyển dụng', 'admin', 'hành chính', 'legal',
  ],
  Logistics: [
    'logistics', 'supply chain', 'xuất nhập khẩu', 'import export', 'warehouse', 'kho vận',
  ],
  Sales: [
    'sales', 'kinh doanh', 'telesale', 'business development', 'account executive',
  ],
  Creative: [
    'graphic', 'design', 'ui ux', 'figma', 'video editor', 'fashion', 'animation', 'illustration',
  ],
  Engineering: [
    'mechanical', 'cơ khí', 'electrical', 'điện', 'automation', 'tự động hóa',
    'civil engineering', 'xây dựng', 'qc', 'qa', 'quality control',
  ],
  Hospitality: [
    'hotel', 'khách sạn', 'tour guide', 'du lịch', 'event', 'f&b', 'nhà hàng',
    'travel consultant', 'tourism',
  ],
  Education: [
    'teaching assistant', 'trợ giảng', 'tutor', 'gia sư', 'educational consultant',
    'tư vấn giáo dục', 'translator', 'interpreter', 'biên dịch', 'phiên dịch',
  ],
};

/**
 * Tự động suy ra nhãn ngành từ title công việc.
 * @returns Nhãn ngành đầu tiên khớp, hoặc 'General' nếu không tìm thấy
 */
export function inferIndustry(title: string): string {
  const lower = title.toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_TAG_MAP)) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return industry;
    }
  }
  return 'General';
}
