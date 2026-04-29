import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';

export const HIERARCHICAL_INDUSTRIES = [
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
    ],
    keywords: ['sales', 'kinh doanh', 'bán hàng', 'b2b', 'b2c', 'telesales', 'phát triển kinh doanh', 'sales admin', 'phân phối', 'đại lý']
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
    ],
    keywords: ['it', 'cntt', 'phần mềm', 'software', 'lập trình', 'developer', 'frontend', 'backend', 'mobile', 'data', 'ai', 'cloud', 'devops', 'tester', 'qa']
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
    ],
    keywords: ['marketing', 'truyền thông', 'pr', 'brand', 'thương hiệu', 'digital marketing', 'sự kiện', 'quảng cáo', 'ads']
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
    ],
    keywords: ['content', 'seo', 'copywriter', 'biên tập', 'nội dung', 'social media', 'tiktok', 'youtube']
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
    ],
    keywords: ['kế toán', 'kiểm toán', 'tài chính', 'ngân hàng', 'chứng khoán', 'đầu tư', 'finance', 'accounting', 'audit']
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
    ],
    keywords: ['nhân sự', 'hr', 'tuyển dụng', 'hành chính', 'pháp lý', 'luật', 'c&b', 'đào tạo', 'admin']
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
    ],
    keywords: ['thiết kế', 'design', 'ui', 'ux', 'đồ họa', 'creative', 'nội thất', 'kiến trúc']
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
    ],
    keywords: ['kỹ thuật', 'cơ khí', 'sản xuất', 'điện', 'bảo trì', 'tự động hóa', 'cnc']
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
    ],
    keywords: ['xây dựng', 'kiến trúc', 'kỹ sư', 'công trình', 'giám sát', 'nội thất']
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
    ],
    keywords: ['logistics', 'vận tải', 'kho bãi', 'xuất nhập khẩu', 'forwarder', 'chuỗi cung ứng']
  },
  {
    category: "Bán Lẻ / Tiêu Dùng",
    subCategories: [
      "Quản Lý Cửa Hàng / Siêu Thị",
      "Tư Vấn Bán Hàng / Thu Ngân",
      "Trưng Bày Hàng Hóa (VM)",
      "Quản Lý Ngành Hàng",
      "Chăm Sóc Khách Hàng"
    ],
    keywords: ['bán lẻ', 'tiêu dùng', 'siêu thị', 'cửa hàng', 'thu ngân', 'retail', 'fmcg']
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
    ],
    keywords: ['nhà hàng', 'khách sạn', 'du lịch', 'đầu bếp', 'chef', 'bartender', 'tour']
  },
  {
    category: "Y Tế / Dược Phẩm",
    subCategories: [
      "Bác Sĩ / Điều Dưỡng",
      "Dược Sĩ / Trình Dược Viên",
      "Xét Nghiệm / Chẩn Đoán Hình Ảnh",
      "Quản Lý Bệnh Viện",
      "Chăm Sóc Sức Khỏe Tại Nhà"
    ],
    keywords: ['y tế', 'dược phẩm', 'bác sĩ', 'điều dưỡng', 'bệnh viện', 'pharma', 'medical']
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
    ],
    keywords: ['giáo dục', 'đào tạo', 'giáo viên', 'giảng viên', 'gia sư', 'education', 'training']
  },
  {
    category: "Nông Nghiệp / Môi Trường",
    subCategories: [
      "Kỹ Thuật Cây Trồng / Vật Nuôi",
      "Thủy Sản / Thức Ăn Chăn Nuôi",
      "Công Nghệ Thực Phẩm",
      "Quản Lý Môi Trường",
      "Năng Lượng Tái Tạo"
    ],
    keywords: ['nông nghiệp', 'môi trường', 'thủy sản', 'chăn nuôi', 'thực phẩm', 'năng lượng']
  },
  {
    category: "Bất Động Sản",
    subCategories: [
      "Môi Giới Bất Động Sản",
      "Đầu Tư / Phát Triển Dự Án",
      "Thẩm Định Giá",
      "Quản Lý Tài Sản",
      "Kinh Doanh Căn Hộ / Mặt Bằng"
    ],
    keywords: ['bất động sản', 'môi giới', 'nhà đất', 'chung cư', 'real estate']
  },
  {
    category: "Truyền Thông / Báo Chí",
    subCategories: [
      "Phóng Viên / Nhà Báo",
      "Biên Tập Nội Dung",
      "Sản Xuất Chương Trình",
      "Quan Hệ Công Chúng (PR)",
      "Phát Thanh / Truyền Hình"
    ],
    keywords: ['truyền thông', 'báo chí', 'phóng viên', 'biên tập', 'pr', 'media']
  },
  {
    category: "Thể Thao / Làm Đẹp / Giải Trí",
    subCategories: [
      "Huấn Luyện Viên (Gym/Yoga)",
      "Chuyên Viên Spa / Massage",
      "Làm Tóc / Trang Điểm",
      "Tổ Chức Sự Kiện Giải Trí",
      "Game / Esports"
    ],
    keywords: ['thể thao', 'làm đẹp', 'giải trí', 'gym', 'yoga', 'spa', 'game', 'esports']
  },
  {
    category: "Luật / Tư Vấn Pháp Lý",
    subCategories: [
      "Luật Sư / Trợ Lý Luật",
      "Tư Vấn Pháp Lý Doanh Nghiệp",
      "Thừa Phát Lại / Công Chứng",
      "Sở Hữu Trí Tuệ"
    ],
    keywords: ['luật', 'pháp lý', 'luật sư', 'pháp chế', 'legal']
  },
  {
    category: "Dệt May / Da Giày",
    subCategories: [
      "Thiết Kế Thời Trang",
      "Quản Lý May Công Nghiệp",
      "Kỹ Thuật Rập - Cắt May",
      "Kiểm Soát Chất Lượng (QA/QC)"
    ],
    keywords: ['dệt may', 'da giày', 'may mặc', 'thời trang', 'textile', 'fashion']
  },
  {
    category: "Thực Phẩm & Đồ Uống (F&B)",
    subCategories: [
      "Phát Triển Sản Phẩm (R&D)",
      "Kiểm Định Thực Phẩm",
      "Quản Lý Chuỗi Nhà Hàng",
      "Kinh Doanh Thực Phẩm"
    ],
    keywords: ['f&b', 'thực phẩm', 'đồ uống', 'nhà hàng', 'food', 'beverage']
  },
  {
    category: "Viễn Thông",
    subCategories: [
      "Kỹ Thuật Viễn Thông",
      "Phát Triển Hạ Tầng Mạng",
      "Kinh Doanh Dịch Vụ Viễn Thông",
      "Chăm Sóc Khách Hàng Viễn Thông"
    ],
    keywords: ['viễn thông', 'telecom', 'mạng', 'network']
  },
  {
    category: "Bảo Hiểm",
    subCategories: [
      "Tư Vấn Bảo Hiểm Nhân Thọ",
      "Bảo Hiểm Phi Nhân Thọ",
      "Giám Định Bồi Thường",
      "Quản Lý Nhóm Kinh Doanh"
    ],
    keywords: ['bảo hiểm', 'insurance']
  },
  {
    category: "Điện / Điện Tử / Điện Lạnh",
    subCategories: [
      "Kỹ Thuật Điện Công Nghiệp",
      "Lắp Đặt Điện Lạnh",
      "Thiết Kế Mạch Điện Tử",
      "Sửa Chữa Đồ Gia Dụng"
    ],
    keywords: ['điện', 'điện tử', 'điện lạnh']
  },
  {
    category: "Hóa Học / Sinh Học",
    subCategories: [
      "Kỹ Thuật Hóa Học",
      "Công Nghệ Sinh Học",
      "Phòng Thí Nghiệm (Lab)",
      "Sản Xuất Mỹ Phẩm / Hóa Chất"
    ],
    keywords: ['hóa học', 'sinh học', 'hóa chất', 'biology', 'chemistry']
  },
  {
    category: "Thời Trang / Mỹ Phẩm",
    subCategories: [
      "Tư Vấn Thời Trang / Stylist",
      "Kinh Doanh Mỹ Phẩm",
      "Quản Lý Cửa Hàng Thời Trang",
      "Người Mẫu / KOLs"
    ],
    keywords: ['thời trang', 'mỹ phẩm', 'fashion', 'cosmetics']
  },
  {
    category: "Cơ Khí / Chế Tạo Máy",
    subCategories: [
      "Vận Hành Máy CNC",
      "Hàn / Tiện / Phay",
      "Thiết Kế Cơ Khí (Solidworks/AutoCAD)",
      "Sửa Chữa Ô Tô / Xe Máy"
    ],
    keywords: ['cơ khí', 'chế tạo máy', 'cnc', 'ô tô', 'xe máy']
  },
  {
    category: "Xuất Nhập Khẩu",
    subCategories: [
      "Chứng Từ Xuất Nhập Khẩu",
      "Hiện Trường (Ops)",
      "Thanh Toán Quốc Tế",
      "Kinh Doanh Cước (Sales Logistics)"
    ],
    keywords: ['xuất nhập khẩu', 'import', 'export', 'logistics']
  },
  {
    category: "Thẩm Mỹ / Spa / Massage",
    subCategories: [
      "Kỹ Thuật Viên Spa",
      "Quản Lý Trung Tâm Thẩm Mỹ",
      "Tư Vấn Làm Đẹp",
      "Chăm Sóc Da / Body"
    ],
    keywords: ['thẩm mỹ', 'spa', 'massage', 'làm đẹp']
  },
  {
    category: "Bảo Vệ / An Ninh",
    subCategories: [
      "Nhân Viên Bảo Vệ",
      "Chỉ Huy Mục Tiêu",
      "Vệ Sĩ Chuyên Nghiệp",
      "An Ninh Tòa Nhà / Khách Sạn"
    ],
    keywords: ['bảo vệ', 'an ninh', 'vệ sĩ']
  },
  {
    category: "Lao Động Phổ Thông",
    subCategories: [
      "Công Nhân Nhà Máy",
      "Nhân Viên Đóng Gói",
      "Phụ Kho / Bốc Xếp",
      "Nhân Viên Vệ Sinh",
      "Giúp Việc / Tạp Vụ"
    ],
    keywords: ['lao động phổ thông', 'công nhân', 'bốc xếp', 'tạp vụ']
  },
  {
    category: "Freelance / Việc Làm Tự Do",
    subCategories: [
      "Cộng Tác Viên Bán Hàng",
      "Freelance Content / Design",
      "Gia Sư Tự Do",
      "Dịch Thuật Tự Do"
    ],
    keywords: ['freelance', 'tự do', 'cộng tác viên']
  }
];

@Injectable()
export class JobCategoryService {
  private readonly logger = new Logger(JobCategoryService.name);

  constructor(private prisma: PrismaService) { }

  identifyCategories(title: string, description?: string, skills?: string[]): string[] {
    const textToAnalyze = `${title} ${description || ''} ${skills?.join(' ') || ''}`.toLowerCase();
    const suggestions = new Set<string>();

    // 1. Phân tích dựa trên HIERARCHICAL_INDUSTRIES
    HIERARCHICAL_INDUSTRIES.forEach(group => {
      // Check top-level keywords
      if (group.keywords.some(kw => textToAnalyze.includes(kw.toLowerCase()))) {
        suggestions.add(group.category);
      }

      // Check subcategories names as keywords
      group.subCategories.forEach(sub => {
        // Lấy phần text trong ngoặc hoặc trước ngoặc để match
        const subClean = sub.replace(/\(.*\)/, '').trim().toLowerCase();
        if (textToAnalyze.includes(subClean) || (sub.includes('/') && sub.split('/').some(p => textToAnalyze.includes(p.trim().toLowerCase())))) {
          suggestions.add(sub);
          suggestions.add(group.category); // Luôn thêm category cha nếu trúng sub
        }
      });
    });

    // 2. Mapping từ khóa kỹ thuật chuyên sâu vào Subcategories chuẩn
    const techMapping: Record<string, string[]> = {
      "Lập Trình Phần Mềm (Frontend/Backend)": ['backend', 'frontend', 'fullstack', 'java', 'node', 'python', 'php', 'c#', '.net', 'react', 'vue', 'angular'],
      "Lập Trình Di Động (iOS/Android)": ['ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
      "Dữ Liệu & AI (Big Data/Machine Learning)": ['ai ', 'machine learning', 'data engineer', 'data analyst', 'big data'],
      "Kiểm Thử Phần Mềm (QC/QA/Tester)": ['qa', 'qc', 'tester', 'automation test'],
      "DevOps / SRE": ['devops', 'ci/cd', 'docker', 'kubernetes', 'jenkins'],
      "Hạ Tầng / Mạng / Cloud": ['aws', 'azure', 'gcp', 'cloud', 'network', 'mạng'],
      "Thiết Kế UI/UX": ['ui/ux', 'figma', 'sketch', 'adobe xd']
    };

    for (const [standardSub, kws] of Object.entries(techMapping)) {
      if (kws.some(kw => textToAnalyze.includes(kw.toLowerCase()))) {
        suggestions.add(standardSub);

        // Tìm và thêm Category cha của standardSub đó
        const parent = HIERARCHICAL_INDUSTRIES.find(g => g.subCategories.includes(standardSub));
        if (parent) suggestions.add(parent.category);
      }
    }

    if (suggestions.size === 0) suggestions.add('Đa lĩnh vực / Khác');

    // Giới hạn số lượng gợi ý để giao diện không bị quá tải
    return Array.from(suggestions).slice(0, 8);
  }

  async syncAllCategories() {
    this.logger.log('Bắt đầu đồng bộ lại danh mục cho tất cả Job...');
    const jobs = await this.prisma.jobPosting.findMany({
      select: {
        jobPostingId: true,
        title: true,
        description: true,
        structuredRequirements: true,
      },
    });

    let updatedCount = 0;
    for (const job of jobs) {
      const struct = (job.structuredRequirements as any) || {};
      const currentCategories = struct.categories || [];

      const newCategories = this.identifyCategories(
        job.title,
        job.description || '',
        struct.hardSkills || [],
      );

      if (
        JSON.stringify([...currentCategories].sort()) !==
        JSON.stringify([...newCategories].sort())
      ) {
        await this.prisma.jobPosting.update({
          where: { jobPostingId: job.jobPostingId },
          data: {
            structuredRequirements: {
              ...struct,
              categories: newCategories,
            },
          },
        });
        updatedCount++;
      }
    }

    this.logger.log(`Đã cập nhật danh mục cho ${updatedCount} jobs.`);
    return {
      message: `Đã đồng bộ lại danh mục cho ${updatedCount}/${jobs.length} tin tuyển dụng.`,
      updatedCount,
    };
  }
}
