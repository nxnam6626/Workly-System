import { Job } from "@/components/JobCard";

const MOCK_DESC = "Chúng tôi đang tìm kiếm ứng viên năng động cho vị trí này. Bạn sẽ được làm việc trong môi trường chuyên nghiệp, trẻ trung và đầy cơ hội thăng tiến.";
const MOCK_REQS = "* Tốt nghiệp đại học chuyên ngành liên quan\n* Có kinh nghiệm là một lợi thế\n* Kỹ năng làm việc nhóm tốt\n* Chịu được áp lực công việc cao";
const MOCK_BENEFITS = "* Lương thưởng hấp dẫn theo năng lực\n* Chế độ bảo hiểm đầy đủ (BHXH, BHYT)\n* Teambuilding hàng năm\n* Phụ cấp cơm trưa và xăng xe";

const baseUrgentJobs: Partial<Job>[] = [
  {
    title: "Thợ Làm Bánh Kem/ Bánh Ngọt/ Nhân Viên Bếp Bánh - Thu Nhập Lên Đến 25 Triệu",
    company: { companyName: "Công Ty TNHH Công Nghệ Thực Phẩm...", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 10000000, salaryMax: 25000000, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Bảo Trì Máy - Cơ Điện",
    company: { companyName: "Công Ty TNHH Nam Vinh Phát", logo: "/logos/workly-gau-logo-2.png" },
    locationCity: "Bình Dương", salaryMin: 11000000, salaryMax: 15000000, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Kế Toán Thuế",
    company: { companyName: "Công Ty TNHH MTV Tư Vấn Đầu Tư Phát...", logo: "/logos/workly-gau-logo-3.png" },
    locationCity: "Hà Nội", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Sales Marketing Manager Lĩnh Vực Xây Dựng",
    company: { companyName: "Công Ty Cổ Phần Xây Dựng Hợp Lực", logo: "/logos/workly-gau-logo-4.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "NO_EXPERIENCE"
  },
  {
    title: "Nhân Viên Tư Vấn Dinh Dưỡng Tại Bệnh Viện",
    company: { companyName: "Công Ty TNHH Vietnam Concentrix Services", logo: "/logos/workly-gau-logo-5.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 7000000, salaryMax: 10000000, jobType: "FULL_TIME", experience: "NO_EXPERIENCE"
  },
  {
    title: "Thực Tập Sinh Môi Giới Chứng Khoán (Định hướng KOC Chứng Khoán)",
    company: { companyName: "Công Ty Cổ Phần Chứng Khoán FPT - Chi...", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 6000000, salaryMax: 20000000, jobType: "FULL_TIME", experience: "NO_EXPERIENCE"
  },
  {
    title: "Nhân Viên Kinh Doanh - Thu Nhập 15 - 30 Triệu (Quận 7)",
    company: { companyName: "Công Ty TNHH Thương Mại Thủy Sản Ocea...", logo: "/logos/workly-gau-logo-2.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 15000000, salaryMax: 30000000, jobType: "FULL_TIME", experience: "UNDER_1_YEAR"
  },
  {
    title: "Nhân Viên Kinh Doanh/Bán Hàng Kênh OTC/ETC",
    company: { companyName: "Công Ty TNHH DP Tâm Đan", logo: "/logos/workly-gau-logo-3.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 13000000, salaryMax: 25000000, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Kỹ Thuật Lắp Đặt / Thi Công Hệ Thống Xử Lý Nước",
    company: { companyName: "Công Ty Cổ Phần Thiết Bị Và Công Nghệ M...", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hà Nội", salaryMin: 12000000, salaryMax: 15000000, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Nhân Viên Kinh Doanh Quốc Tế",
    company: { companyName: "Công Ty Cổ Phần Daplast", logo: "/logos/workly-gau-logo-5.png" },
    locationCity: "Hà Nội", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "UNDER_1_YEAR"
  },
  {
    title: "Nhân Viên Tư Vấn/Chăm Sóc Khách Hàng",
    company: { companyName: "Công Ty TNHH Kinh Doanh Tư Vấn Đầu Tư...", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 8000000, salaryMax: null, jobType: "FULL_TIME", experience: "NO_EXPERIENCE"
  },
  {
    title: "Trưởng Phòng Kinh Doanh - Kênh Đại Lý",
    company: { companyName: "Công Ty TNHH Manulife Việt Nam", logo: "/logos/workly-gau-logo-4.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  }
];

const baseRecommendedJobs: Partial<Job>[] = [
  {
    title: "Kỹ Sư Giải Pháp Quản Trị Phần Mềm (Solution Engineer Fresher)",
    company: { companyName: "Công Ty Cổ Phần Base Enterprise", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 8000000, salaryMax: 9000000, jobType: "FULL_TIME", experience: "UNDER_1_YEAR"
  },
  {
    title: "SEO Web - Đi Làm Ngay",
    company: { companyName: "Công Ty Cổ Phần Tàu Cao Tốc Phú Quốc", logo: "/logos/workly-gau-logo-2.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 13000000, salaryMax: 15000000, jobType: "FULL_TIME", experience: "UNDER_1_YEAR"
  },
  {
    title: "CNC Programmer (Experienced Requirement)",
    company: { companyName: "Công Ty TNHH Roeders Việt Nam", logo: "/logos/workly-gau-logo-3.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "3_TO_5_YEARS"
  },
  {
    title: "Thực Tập Sinh Công Nghệ Thông Tin (IT)",
    company: { companyName: "Công Ty TNHH Nine Outfit", logo: "/logos/workly-gau-logo-4.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 2000000, salaryMax: 4000000, jobType: "REMOTE", experience: "NO_EXPERIENCE"
  },
  {
    title: "Senior / Principal Php Software Engineer - MSCV 233-1",
    company: { companyName: "Công Ty TNHH Quick Việt Nam", logo: "/logos/workly-gau-logo-5.png" },
    locationCity: "Hồ Chí Minh", salaryMin: 26000000, salaryMax: 44000000, jobType: "FULL_TIME", experience: "OVER_5_YEARS"
  },
  {
    title: "Senior PHP Developer",
    company: { companyName: "Công Ty TNHH Công Nghệ Cloudgo", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "3_TO_5_YEARS"
  },
  {
    title: "Thực Tập Công Nghệ Thông Tin AI",
    company: { companyName: "Công Ty TNHH Duy Trường Phát", logo: "/logos/workly-gau-logo-2.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "REMOTE", experience: "NO_EXPERIENCE"
  },
  {
    title: "Blockchain Leader",
    company: { companyName: "Công Ty TNHH Ton Corporation", logo: "/logos/workly-gau-logo-3.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: 80000000, jobType: "FULL_TIME", experience: "OVER_5_YEARS"
  },
  {
    title: "Thực Tập Sinh Phát Triển Học Liệu",
    company: { companyName: "Công Ty TNHH Học Viện Gia Sư The Tutorx", logo: "/logos/workly-gau-logo-4.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "REMOTE", experience: "NO_EXPERIENCE"
  },
  {
    title: "Nhân Viên Technical SEO Tại Hồ Chí Minh",
    company: { companyName: "Công Ty Cổ Phần Không Gian Gốm Bát Tràng", logo: "/logos/workly-gau-logo-5.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "1_TO_3_YEARS"
  },
  {
    title: "Kỹ Sư CNTT",
    company: { companyName: "Công Ty Cổ Phần ATDD Việt Nam", logo: "/logos/workly-gau-logo.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "FULL_TIME", experience: "NO_EXPERIENCE"
  },
  {
    title: "Thực Tập Sinh Phần Mềm Ứng Dụng Công Nghệ",
    company: { companyName: "Công Ty TNHH CMT-Dragon", logo: "/logos/workly-gau-logo-2.png" },
    locationCity: "Hồ Chí Minh", salaryMin: null, salaryMax: null, jobType: "REMOTE", experience: "NO_EXPERIENCE"
  }
];

const generateJobs = (base: Partial<Job>[], count: number, prefix: string, tier?: string): Job[] => {
  const jobs: Job[] = [];
  for (let i = 0; i < count; i++) {
    const b = base[i % base.length];
    jobs.push({
      jobPostingId: `${prefix}${i + 1}`,
      title: b.title!,
      company: b.company!,
      locationCity: b.locationCity || "Toàn quốc",
      salaryMin: b.salaryMin ?? null,
      salaryMax: b.salaryMax ?? null,
      currency: "VND",
      jobType: (b.jobType as any) || "FULL_TIME",
      experience: (b.experience as any) || "NO_EXPERIENCE",
      createdAt: new Date(Date.now() - (i * 15) * 60000).toISOString(),
      isVerified: true,
      postType: 'MANUAL',
      jobTier: (tier as any) || 'NORMAL',
      description: MOCK_DESC,
      requirements: MOCK_REQS,
      benefits: MOCK_BENEFITS,
    });
  }
  return jobs;
};

export const MOCK_URGENT_JOBS: Job[] = generateJobs(baseUrgentJobs, 96, 'u', 'URGENT');
export const MOCK_RECOMMENDED_JOBS: Job[] = generateJobs(baseRecommendedJobs, 96, 'r', 'NORMAL');

export const INTERNSHIP_CATEGORIES = [
  "Tất cả", "IT", "SEO", "R&D", "Pháp Lý", "Nhân Sự", "Kinh Doanh", "Kế Toán", "Đào Tạo", "Kỹ Thuật", "Thiết Kế", "Marketing", "Tuyển Dụng"
];

const baseINTERNSHIPJobs: Partial<Job>[] = [
  { title: "Thực Tập Sinh Nhân Sự (HR Intern)", category: "Nhân Sự", company: { companyName: "Công Ty Cổ Phần BPO Mắt Bão", logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg" }, salaryMin: 0, salaryMax: 0, locationCity: "Hồ Chí Minh" },
  { title: "Thực Tập Sinh Marketing", category: "Marketing", company: { companyName: "Công Ty Cổ Phần Thương Mại Visnam", logo: "https://vcdn.jobsgo.vn/company_logos/vIAnUo6I8a.jpg" }, salaryMin: 0, salaryMax: 0, locationCity: "Đà Nẵng" },
  { title: "Thực Tập Sinh Thu Hút Nhân Tài (Talent Acquisition)", category: "Tuyển Dụng", company: { companyName: "Công Ty TNHH Quốc Tế Tam Sơn", logo: "https://vcdn.jobsgo.vn/company_logos/z7a7eUuN1C.jpg" }, salaryMin: 4000000, salaryMax: 4000000, locationCity: "Hà Nội" },
  { title: "Thực Tập Sinh Kế Toán Có Lương", category: "Kế Toán", company: { companyName: "Công Ty TNHH ShanhaiMap Việt Nam", logo: "https://vcdn.jobsgo.vn/company_logos/6PIdVvXy2b.jpg" }, salaryMin: 4000000, salaryMax: 4000000, locationCity: "Hồ Chí Minh" },
  { title: "Thực Tập Sinh Telesales", category: "Kinh Doanh", company: { companyName: "Công Ty Cổ Phần Công Nghệ Sen Đỏ", logo: "https://vcdn.jobsgo.vn/company_logos/j3IdMvYq5e.jpg" }, salaryMin: 0, salaryMax: 0, locationCity: "Hà Nội" },
  { title: "Thực Tập Sinh Chăm Sóc Khách Hàng", category: "Nhân Sự", company: { companyName: "Uoymedia Company", logo: "https://vcdn.jobsgo.vn/company_logos/vPIdLuZq5v.jpg" }, salaryMin: 0, salaryMax: 0, locationCity: "Đà Nẵng" },
];

export const MOCK_INTERNSHIP_JOBS: Job[] = generateJobs(baseINTERNSHIPJobs as Job[], 72, 'i', 'NORMAL');

export const MOCK_FEATURED_JOBS: Job[] = generateJobs(baseUrgentJobs, 96, 'f', 'NORMAL');

export interface Company {
  id: string;
  name: string;
  logo: string;
  description: string;
  activeJobs: number;
  industry: string;
}

export const COMPANY_CATEGORIES = [
  { title: "Tiêu Biểu", count: "540+ Doanh nghiệp", icon: "Award" },
  { title: "Nổi Bật", count: "440+ Doanh nghiệp", icon: "Star" },
  { title: "Ngân Hàng", count: "100+ Doanh nghiệp", icon: "Landmark" },
  { title: "Bảo Hiểm", count: "35+ Doanh nghiệp", icon: "ShieldCheck" },
  { title: "Công Nghệ", count: "315+ Doanh nghiệp", icon: "Laptop" },
  { title: "Xây Dựng", count: "200+ Doanh nghiệp", icon: "HardHat" },
  { title: "Sản Xuất", count: "600+ Doanh nghiệp", icon: "Factory" },
  { title: "Nhà Hàng", count: "150+ Doanh nghiệp", icon: "Utensils" },
  { title: "Khách Sạn", count: "120+ Doanh nghiệp", icon: "Hotel" },
  { title: "Y Tế", count: "80+ Doanh nghiệp", icon: "Stethoscope" },
  { title: "Bất Động Sản", count: "250+ Doanh nghiệp", icon: "Building" },
  { title: "Giáo Dục", count: "180+ Doanh nghiệp", icon: "GraduationCap" },
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: "c1",
    name: "Công Ty Cổ Phần Kết Nối Nhân Lực Worklink Việt Nam",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg",
    description: "Worklink Việt Nam là đơn vị hàng đầu trong lĩnh vực cung ứng nhân lực cấp cao và tư vấn giải pháp nhân sự toàn diện.",
    activeJobs: 2023,
    industry: "Kinh doanh"
  },
  {
    id: "c2",
    name: "Bellsystem24 VietNam",
    logo: "https://vcdn.jobsgo.vn/company_logos/vIAnUo6I8a.jpg",
    description: "Bellsystem24 Việt Nam là đơn vị dẫn đầu thị trường trong lĩnh vực Contact Center & BPO (Dịch Vụ Tổng Đài).",
    activeJobs: 1692,
    industry: "Dịch vụ"
  },
  {
    id: "c3",
    name: "Công Ty TNHH Reeracoen Việt Nam",
    logo: "https://vcdn.jobsgo.vn/company_logos/z7a7eUuN1C.jpg",
    description: "Reeracoen là tập đoàn tư vấn nhân sự và tuyển dụng đa quốc gia đến từ Nhật Bản, hỗ trợ kết nối nhân tài.",
    activeJobs: 1336,
    industry: "Tư vấn"
  },
  {
    id: "c4",
    name: "Công Ty TNHH Vietnam Concentrix Services",
    logo: "/logos/workly-gau-logo-5.png",
    description: "Concentrix là đối tác toàn cầu hàng đầu về giải pháp trải nghiệm khách hàng (CX) và công nghệ số.",
    activeJobs: 1089,
    industry: "Hoạt động dịch vụ liên quan đến các ngành nghề khác"
  },
  {
    id: "c5",
    name: "Công Ty TNHH Tư Vấn Nhân Sự Kokoro",
    logo: "/logos/workly-gau-logo.png",
    description: "Kokoro HR cung cấp các giải pháp tuyển dụng chất lượng cao, tập trung vào thị trường lao động chuyên nghiệp.",
    activeJobs: 322,
    industry: "Tư vấn giới thiệu việc làm công ty nhà tuyển dụng"
  },
  {
    id: "c6",
    name: "Công Ty Cổ Phần Truyền Thông Kim Cương",
    logo: "/logos/workly-gau-logo-2.png",
    description: "Kim Cương Media là đơn vị sáng tạo nội dung và giải pháp truyền thông tích hợp hàng đầu.",
    activeJobs: 203,
    industry: "Đào tạo"
  },
  {
    id: "c7",
    name: "Công Ty Cổ Phần Green Speed",
    logo: "https://vcdn.jobsgo.vn/company_logos/vPIdLuZq5v.jpg",
    description: "Green Speed là công ty cung cấp giải pháp nhân sự và quản lý kho vận chuyên nghiệp.",
    activeJobs: 200,
    industry: "N/A"
  },
  {
    id: "c8",
    name: "Công Ty Cổ Phần BPO Mắt Bão",
    logo: "https://vcdn.jobsgo.vn/company_logos/hDIdkXzJ9W.jpg",
    description: "Mắt Bão BPO cung cấp các dịch vụ thuê ngoài quy trình kinh doanh, chăm sóc khách hàng và quản lý nhân sự.",
    activeJobs: 195,
    industry: "Kinh doanh, Công nghệ thông tin,..."
  },
  {
    id: "c9",
    name: "Headhunter Vietnam Hrchannels.com",
    logo: "https://vcdn.jobsgo.vn/company_logos/6PIdVvXy2b.jpg",
    description: "Hrchannels là nền tảng tuyển dụng nhân sự cấp cao và săn đầu người hàng đầu tại Việt Nam.",
    activeJobs: 179,
    industry: "Nhân sự"
  },
  {
    id: "c10",
    name: "Công Ty TNHH Quick Việt Nam",
    logo: "/logos/workly-gau-logo-3.png",
    description: "Quick Việt Nam chuyên cung cấp các dịch vụ tuyển dụng và tư vấn nhân sự nhanh chóng, hiệu quả.",
    activeJobs: 138,
    industry: "Nhân sự"
  },
  {
    id: "c11",
    name: "Công Ty TNHH Việt Mỹ SSU",
    logo: "/logos/workly-gau-logo-4.png",
    description: "Việt Mỹ SSU hoạt động đa lĩnh vực với các dịch vụ bổ trợ kinh doanh và dịch vụ liên quan.",
    activeJobs: 87,
    industry: "Hoạt động dịch vụ liên quan đến các..."
  },
  {
    id: "c12",
    name: "Công Ty Cổ Phần Liên Doanh Galatex Việt Nam",
    logo: "/logos/workly-gau-logo-5.png",
    description: "Galatex chuyên về sản xuất và kinh doanh các sản phẩm dệt may, da giầy và phụ kiện liên quan.",
    activeJobs: 85,
    industry: "Hoạt động sản xuất và kinh doanh sơ..."
  },
  {
    id: "c13",
    name: "Công Ty TNHH Bảo Hiểm Nhân Thọ MB Ageas",
    logo: "/logos/workly-gau-logo.png",
    description: "MB Ageas Life là công ty bảo hiểm nhân thọ liên doanh giữa Ngân hàng Quân đội (MB) và tập đoàn Ageas.",
    activeJobs: 81,
    industry: "Bảo hiểm"
  },
  {
    id: "c14",
    name: "Công Ty TNHH Sản Xuất Thương Mại Nhựa Tốt",
    logo: "/logos/workly-gau-logo-2.png",
    description: "Nhựa Tốt chuyên sản xuất và phân phối các sản phẩm nhựa phục vụ công nghiệp và dân dụng.",
    activeJobs: 64,
    industry: "Sản xuất/Vận hành sản xuất"
  },
  {
    id: "c15",
    name: "Công Ty Cổ Phần HR Focus Việt Nam",
    logo: "/logos/workly-gau-logo-3.png",
    description: "HR Focus chuyên về tư vấn chiến lược nhân sự và giải pháp quản lý con người cho doanh nghiệp.",
    activeJobs: 58,
    industry: "Kinh doanh"
  },
  {
    id: "c16",
    name: "Công Ty Tài Chính Trách Nhiệm Hữu Hạn Một Thành Viên Mirae Asset",
    logo: "/logos/workly-gau-logo-4.png",
    description: "Mirae Asset Finance cung cấp các giải pháp tài chính cá nhân và doanh nghiệp từ tập đoàn tài chính Hàn Quốc.",
    activeJobs: 58,
    industry: "Tài chính/Kế toán/Kiểm toán"
  },
  {
    id: "c17",
    name: "Công Ty TNHH Sức Bật",
    logo: "/logos/workly-gau-logo-5.png",
    description: "Sức Bật chuyên về cung cấp nguồn nhân lực và giải pháp đào tạo kỹ năng cho thế hệ trẻ.",
    activeJobs: 54,
    industry: "Cung cấp nguồn nhân sự chuyên biệt..."
  }
];
