import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '../../../prisma/prisma.service';
import { JobStatus, Prisma } from '@/generated/prisma';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { MessagesGateway } from '../../messages/messages.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { JobAlertsService } from '../../job-alerts/job-alerts.service';
import { SearchService } from '../../search/search.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiService } from '../../ai/ai.service';
import { MatchingOrchestratorService } from '../../matching-engine/services/matching-orchestrator.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';
import { EVASION_REGEX } from '../../ai/ai-moderation.service';

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
export class JobPostingsService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
    private jobAlertsService: JobAlertsService,
    private searchService: SearchService,
    @InjectQueue('matching') private matchingQueue: Queue,
    private aiService: AiService,
    private subscriptionsService: SubscriptionsService,
    private matchingOrchestrator: MatchingOrchestratorService,
  ) { }

  private readonly VIOLATION_LIMIT = 3;
  private readonly logger = new Logger(JobPostingsService.name);

  async preCheck(createJobPostingDto: CreateJobPostingDto) {
    const { containsBadWords, foundWords } = this.validateBlacklist(
      createJobPostingDto.title,
      createJobPostingDto.description,
      createJobPostingDto.requirements,
      createJobPostingDto.benefits,
      createJobPostingDto.hardSkills as string[],
      createJobPostingDto.softSkills as string[],
    );

    if (containsBadWords) {
      return {
        score: 40,
        safe: false,
        reason: 'Nội dung chứa từ khóa bị cấm.',
        flags: foundWords,
        feedback: ['Vui lòng loại bỏ các từ ngữ không phù hợp hoặc thông tin liên hệ cá nhân (số điện thoại, link mạng xã hội) khỏi mô tả.'],
        usedAI: false,
      };
    }

    const modResult = await this.aiService.moderateJobContent(
      createJobPostingDto.title,
      createJobPostingDto.description,
      createJobPostingDto.requirements,
      createJobPostingDto.benefits,
      createJobPostingDto.hardSkills as string[],
      createJobPostingDto.jobTier || 'BASIC',
    );

    return {
      ...modResult,
      suggestedAction: modResult.score < 70 ? 'Sửa lại JD để được duyệt tự động, hoặc gửi Admin duyệt thủ công.' : 'JD đạt chuẩn, có thể đăng ngay.',
    };
  }

  private async enrichKeywordsInBackground(
    jobId: string,
    title: string,
    hardSkills: string[],
  ) {
    try {
      if (!hardSkills || hardSkills.length === 0) return;
      const expandedSkills = await this.aiService.expandJobKeywords(
        title,
        hardSkills,
      );
      if (Object.keys(expandedSkills).length > 0) {
        const job = await this.prisma.jobPosting.findUnique({
          where: { jobPostingId: jobId },
        });
        if (job && job.structuredRequirements) {
          const reqs = job.structuredRequirements as any;
          reqs.expandedSkills = expandedSkills;
          await this.prisma.jobPosting.update({
            where: { jobPostingId: jobId },
            data: { structuredRequirements: reqs },
          });
          // Re-trigger matching queue to apply the new enriched keywords
          await this.matchingQueue.add('match', { jobId });
        }
      }
    } catch (e) {
      console.error('enrichKeywordsInBackground failed:', e);
    }
  }

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { company: true },
    });

    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException(
        'Thông tin nhà tuyển dụng hoặc công ty chưa được thiết lập.',
      );
    }

    const {
      deadline,
      salaryMin,
      salaryMax,
      hardSkills,
      softSkills,
      minExperienceYears,
      jobTier,
      jobLevel,
      branchIds,
      isAiGenerated,
      ...rest
    } = createJobPostingDto as any;

    const finalJobLevel = jobLevel && jobLevel !== '' ? jobLevel : 'STAFF';

    // Đảm bảo không còn crawlSourceId lọt vào (nếu có từ decorator cũ hoặc cache)
    delete rest.crawlSourceId;

    const baseSlug = createJobPostingDto.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const randomPart = Math.random().toString(36).substring(2, 7);
    const generatedSlug = `${baseSlug}-${randomPart}`;

    const requestedJobTier = jobTier || 'BASIC';

    // TRỪ XU HOẶC CHECK QUOTA GÓI TRƯỚC KHI TẠO JOB
    await this.subscriptionsService.checkPermissionAndDeduct(
      userId,
      requestedJobTier,
    );

    // Kiểm tra logic lương
    if (
      salaryMin !== undefined &&
      salaryMax !== undefined &&
      salaryMin > salaryMax
    ) {
      throw new ForbiddenException(
        'Lương tối thiểu không thể lớn hơn lương tối đa.',
      );
    }

    const originalUrl =
      'manual-' + Date.now() + '-' + Math.round(Math.random() * 1e9);

    // Automatic Content Moderation — Gemini AI thật (fallback về random nếu quota hết)
    const { containsBadWords, foundWords } = this.validateBlacklist(
      createJobPostingDto.title,
      createJobPostingDto.description,
      createJobPostingDto.requirements,
      createJobPostingDto.benefits,
      hardSkills,
      softSkills,
    );

    let aiReliabilityScore: number;
    let finalStatus: JobStatus = JobStatus.PENDING;
    let modResult: any = null;

    if (containsBadWords) {
      // Blacklist hit → từ chối ngay, không cần gọi AI
      aiReliabilityScore = 40;
      finalStatus = JobStatus.REJECTED;
      modResult = {
        score: 40,
        safe: false,
        flags: foundWords,
        reason: 'Nội dung chứa từ khóa bị cấm.',
        feedback: ['Vui lòng loại bỏ các từ ngữ không phù hợp hoặc thông tin liên hệ cá nhân (số điện thoại, link mạng xã hội) khỏi mô tả.'],
      };
    } else {
      // Gọi Gemini để kiểm duyệt nội dung thật
      modResult = await this.aiService.moderateJobContent(
        createJobPostingDto.title,
        createJobPostingDto.description,
        createJobPostingDto.requirements,
        createJobPostingDto.benefits,
        hardSkills,
        requestedJobTier,
      );
      aiReliabilityScore = modResult.score;

      if (!modResult.safe || modResult.score < 50) {
        finalStatus = JobStatus.REJECTED; // Thông tin rác / Vi phạm / Thiếu sót nặng → Tự động từ chối
        this.logger.warn(
          `[JobPostings] JD "${createJobPostingDto.title}" auto-rejected by AI (score=${aiReliabilityScore}): ${modResult.reason} | flags: ${modResult.flags.join(', ')}`,
        );
      } else if (modResult.score < 70) {
        finalStatus = JobStatus.PENDING; // Cần admin duyệt thủ công
        this.logger.warn(
          `[JobPostings] JD "${createJobPostingDto.title}" flagged pending by AI (score=${aiReliabilityScore}): ${modResult.reason}`,
        );
      } else {
        finalStatus = JobStatus.APPROVED; // AI xác nhận an toàn → tự động duyệt
        this.logger.log(
          `[JobPostings] JD "${createJobPostingDto.title}" auto-approved (score=${aiReliabilityScore}, usedAI=${modResult.usedAI})`,
        );
      }
    }

    // Determine Industry Categories
    const categories = this.identifyCategories(createJobPostingDto.title, createJobPostingDto.description, hardSkills);

    const job = await this.prisma.jobPosting.create({
      data: {
        ...rest,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        status: finalStatus,
        jobTier: requestedJobTier,
        jobLevel: finalJobLevel,
        isVerified: finalStatus === 'APPROVED',
        aiReliabilityScore,
        slug: generatedSlug,
        moderationFeedback: modResult,
        structuredRequirements: {
          hardSkills: hardSkills || [],
          softSkills: softSkills || [],
          minExperienceYears: minExperienceYears || 0,
          vacancies: createJobPostingDto.vacancies || 1,
          isAiGenerated: isAiGenerated === true,
          categories,
        },
        branches: {
          create:
            createJobPostingDto.branchIds?.map((id) => ({ branchId: id })) ||
            [],
        },
      },
      include: {
        company: true,
        recruiter: { include: { user: { select: { email: true } } } },
      },
    });

    // Nếu bị từ chối tự động (do blacklist hoặc AI đánh giá không an toàn) -> Cộng 1 lượt vi phạm
    if (finalStatus === JobStatus.REJECTED) {
      await this.checkAndAutoLockRecruiter(recruiter.recruiterId);
    }

    if (finalStatus === 'APPROVED') {
      try {
        await this.syncJobToES(job);
      } catch (e) {
        console.error('ES Sync failed automatically', e);
      }
    }
    // Tự động chạy Matching Engine
    await this.matchingQueue.add('match', { jobId: job.jobPostingId });

    if (requestedJobTier === 'PROFESSIONAL' || requestedJobTier === 'URGENT') {
      this.enrichKeywordsInBackground(
        job.jobPostingId,
        job.title,
        hardSkills || [],
      );
    }

    if (finalStatus === 'APPROVED') {
      const title = 'Tin tuyển dụng được duyệt tự động';
      const message = `Tin tuyển dụng "${job.title}" của bạn đã được hệ thống AI tự động phê duyệt an toàn.`;
      await this.notificationsService.create(
        userId,
        title,
        message,
        'success',
        '/recruiter/jobs',
      );
      this.messagesGateway.server.to(`user_${userId}`).emit('notification', {
        title,
        message,
        type: 'success',
        link: '/recruiter/jobs',
      });
      this.messagesGateway.server.emit('adminJobUpdated');
      this.triggerJobNotifications(job);
    } else if (finalStatus === 'REJECTED' && containsBadWords) {
      const title = 'Tin tuyển dụng bị từ chối tự động';
      const message = `Tin tuyển dụng "${job.title}" của bạn đã bị từ chối do vi phạm quy định. Từ khóa vi phạm: ${foundWords.join(', ')}.`;
      await this.notificationsService.create(
        userId,
        title,
        message,
        'error',
        '/recruiter/jobs',
      );
      this.messagesGateway.server.to(`user_${userId}`).emit('notification', {
        title,
        message,
        type: 'error',
        link: '/recruiter/jobs',
      });
      this.messagesGateway.server.emit('adminJobUpdated');
    }
    const admins = await this.prisma.user.findMany({
      where: {
        userRoles: { some: { role: { roleName: 'ADMIN' } } },
      },
    });

    if (admins.length > 0) {
      const title =
        finalStatus === 'REJECTED' && containsBadWords
          ? 'Tin tuyển dụng vi phạm quy định'
          : 'Tin tuyển dụng mới cần duyệt';

      const message =
        finalStatus === JobStatus.REJECTED && containsBadWords
          ? `Hệ thống vừa từ chối tự động tin tuyển dụng "${job.title}" từ công ty ${recruiter.company?.companyName || 'mới'} do chứa từ khóa vi phạm: ${foundWords.join(', ')}.`
          : `Nhà tuyển dụng ${recruiter.company?.companyName || 'mới'} vừa đăng tin "${job.title}". Vui lòng kiểm tra và phê duyệt.`;

      const notifyType = finalStatus === 'REJECTED' ? 'error' : 'info';

      for (const admin of admins) {
        await this.notificationsService.create(
          admin.userId,
          title,
          message,
          notifyType,
          '/admin/jobs',
        );
        this.messagesGateway.server
          .to(`user_${admin.userId}`)
          .emit('notification', {
            title,
            message,
            type: notifyType,
            link: '/admin/jobs',
          });
        this.messagesGateway.server
          .to(`user_${admin.userId}`)
          .emit('newJobPosting', job);
      }
    }

    return job;
  }

  // Normalize location query to match multiple aliases
  private buildLocationCondition(location?: string): any | undefined {
    if (!location) return undefined;

    const LOCATION_ALIASES: Record<string, string[]> = {
      'Hồ Chí Minh': [
        'TPHCM',
        'TP HCM',
        'TP. HCM',
        'Ho Chi Minh',
        'HCM',
        'Thành phố Hồ Chí Minh',
        'TP Hồ Chí Minh',
      ],
      'Hà Nội': [
        'Ha Noi',
        'Hanoi',
        'Thành phố Hà Nội',
        'TP Hà Nội',
        'TP. Hà Nội',
      ],
      'Đà Nẵng': ['Da Nang', 'Danang', 'Thành phố Đà Nẵng'],
      'Cần Thơ': ['Can Tho', 'Thành phố Cần Thơ'],
      'Hải Phòng': ['Hai Phong', 'Thành phố Hải Phòng'],
    };

    // Find canonical key matching input (or reverse - input is alias)
    const variants = new Set<string>([location]);

    // Direct lookup
    if (LOCATION_ALIASES[location]) {
      LOCATION_ALIASES[location].forEach((v) => variants.add(v));
    }

    // Reverse lookup: input might be an alias, find the canonical
    for (const [canonical, aliases] of Object.entries(LOCATION_ALIASES)) {
      if (aliases.some((a) => a.toLowerCase() === location.toLowerCase())) {
        variants.add(canonical);
        aliases.forEach((v) => variants.add(v));
      }
    }

    return {
      OR: Array.from(variants).map((v) => ({
        locationCity: { contains: v, mode: 'insensitive' },
      })),
    };
  }

  async findAll(query: FilterJobPostingDto, userId?: string) {
    const {
      search,
      location,
      jobType,
      jobTier,
      page = 1,
      limit = 10,
      industry,
      experience,
      salaryMin,
      salaryMax,
      sortBy,
    } = query;

    // Use Elasticsearch for searching and filtering IDs
    let ids: string[] = [];
    let total = 0;
    try {
      const result = await this.searchService.searchJobs({
        search,
        location,
        jobTier,
        jobType,
        industry,
        experience,
        salaryMin,
        salaryMax,
        sortBy,
        page,
        limit,
      });
      ids = result.ids;
      total = result.total;
    } catch (error) {
      console.warn(
        'Elasticsearch/SearchService failed, falling back to Prisma',
        error?.message,
      );
      return this.findAllPrisma(query, userId);
    }

    if (ids.length === 0 && total === 0 && !search) {
      // Fallback or initial state if ES is empty but we have jobs in DB
      // This is helpful if sync hasn't run yet
      return this.findAllPrisma(query, userId);
    }

    if (ids.length === 0) {
      // Nếu search bằng ES không ra kết quả, thử fallback về Prisma để đảm bảo không bị trống do chưa sync
      return this.findAllPrisma(query, userId);
    }

    // Fetch full data from Prisma using IDs from ES
    const whereCondition: any = {
      jobPostingId: { in: ids },
      status: 'APPROVED',
    };
    if (jobTier) whereCondition.jobTier = jobTier;

    // Apply fuzzy location filter on top of ES results to handle alias mismatches
    const locationCond = this.buildLocationCondition(location);
    if (locationCond) {
      whereCondition.AND = [locationCond];
    }

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter) {
        whereCondition.NOT = { recruiterId: recruiter.recruiterId };
      }
    }

    const items = await this.prisma.jobPosting.findMany({
      where: whereCondition,
      include: {
        company: true,
        recruiter: true,
        branches: {
          include: {
            branch: true,
          },
        },
      },
    });

    // Sort items to match ES order (relevance or custom sort)
    let sortedItems = ids
      .map((id) => {
        const item = items.find((it) => it.jobPostingId === id) as any;
        if (item) {
          item.branches = item.branches.map((b: any) => b.branch);
        }
        return item;
      })
      .filter((item) => !!item) as any[];

    // Add hasApplied status if userId is provided
    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: ids },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map((a) => a.jobPostingId));
        sortedItems = sortedItems.map((item) => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items: sortedItems, total, page, limit };
  }

  // Backup method using Prisma directly
  private async findAllPrisma(query: FilterJobPostingDto, userId?: string) {
    const { search, location, jobType, jobTier, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'APPROVED',
    };

    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter) {
        where.NOT = { recruiterId: recruiter.recruiterId };
      }
    }

    // Industry selection: prioritize sub-category or main category
    const { industry } = query;
    let industriesToMatch: string[] = [];
    let industryKeywords: string[] = [];

    if (industry) {
      // 1. Try to find if it's a main category
      const targetCat = HIERARCHICAL_INDUSTRIES.find(c => c.category === industry);
      if (targetCat) {
        // If it's a main category, match it and all its sub-categories
        industriesToMatch = [targetCat.category, ...targetCat.subCategories];
        industryKeywords = targetCat.keywords;
      } else {
        // If it's not a main category, it's likely a sub-category name
        industriesToMatch = [industry];
      }
    }

    // Build all filter clauses — use AND to combine safely
    const andClauses: any[] = [];

    // Location filter
    const locationCond = this.buildLocationCondition(location);
    if (locationCond) andClauses.push(locationCond);

    if (jobType) where.jobType = jobType;
    if (jobTier) where.jobTier = jobTier;

    // Search filter
    if (search) {
      const searchWords = search.split(/\s+/).filter((w) => w.length > 1);
      if (searchWords.length > 1) {
        andClauses.push({
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            {
              AND: searchWords.map((word) => ({
                OR: [
                  { title: { contains: word, mode: "insensitive" } },
                  { description: { contains: word, mode: "insensitive" } },
                ],
              })),
            },
            {
              company: { companyName: { contains: search, mode: "insensitive" } },
            },
          ],
        });
      } else {
        andClauses.push({
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            {
              company: { companyName: { contains: search, mode: "insensitive" } },
            },
          ],
        });
      }
    }

    // Industry keyword filter
    // Industry keyword filter
    if (industriesToMatch.length > 0 || industryKeywords.length > 0) {
      const industryConds: any[] = [];

      // 1. Match against structured categories (exact names)
      if (industriesToMatch.length > 0) {
        // Since structuredRequirements is a JSON, we use string matching or path matching
        // In PostgreSQL with Prisma, we can use "path" and "string_contains" or similar
        industriesToMatch.forEach(name => {
          industryConds.push({
            structuredRequirements: {
              path: ['categories'],
              array_contains: name
            }
          });
        });
      }

      // 2. Match against keywords in text fields
      const allKeywords = [...new Set([...industriesToMatch, ...industryKeywords])];
      allKeywords.forEach((kw) => {
        industryConds.push({ title: { contains: kw, mode: 'insensitive' } });
        industryConds.push({ description: { contains: kw, mode: 'insensitive' } });
        industryConds.push({ requirements: { contains: kw, mode: 'insensitive' } });
      });

      andClauses.push({ OR: industryConds });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    // Sorting logic
    let orderBy: any = [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];
    const { sortBy } = query;

    if (sortBy === 'new') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (sortBy === 'updated') {
      orderBy = [{ refreshedAt: 'desc' }];
    } else if (sortBy === 'salary') {
      orderBy = [{ salaryMax: 'desc' }];
    } else if (sortBy === 'suitable') {
      orderBy = [{ jobTier: 'desc' }, { refreshedAt: 'desc' }];
    }

    let [items, total] = (await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: true,
          branches: {
            include: {
              branch: true,
            },
          },
        },
        orderBy: orderBy,
      }),
      this.prisma.jobPosting.count({ where }),
    ])) as [any[], number];

    items = items.map((item) => ({
      ...item,
      branches: item.branches.map((b: any) => b.branch),
    }));

    // Add hasApplied status if userId is provided
    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        const jobPostingIds = items.map((item) => item.jobPostingId);
        const applications = await this.prisma.application.findMany({
          where: {
            candidateId: candidate.candidateId,
            jobPostingId: { in: jobPostingIds },
          },
          select: { jobPostingId: true },
        });
        const appliedJobIds = new Set(applications.map((a) => a.jobPostingId));
        items = items.map((item) => ({
          ...item,
          hasApplied: appliedJobIds.has(item.jobPostingId),
        }));
      }
    }

    return { items, total, page, limit };
  }

  async findMyJobs(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const jobs = await this.prisma.jobPosting.findMany({
      where: { recruiterId: recruiter.recruiterId },
      include: {
        applications: true,
        branches: {
          include: {
            branch: true,
          },
        },
      },
      orderBy: { refreshedAt: 'desc' },
    });

    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        let matchedCount = 0;
        let autoInvitedCandidates: any[] = [];

        if (job.status !== 'REJECTED') {
          // 1. Lấy số lượng phù hợp từ JobMatch
          const matches = await this.prisma.jobMatch.findMany({
            where: { jobPostingId: job.jobPostingId },
            include: {
              candidate: {
                include: { user: { select: { avatar: true } } },
              },
            },
            orderBy: { score: 'desc' },
          });
          matchedCount = matches.filter(m => m.score >= 60).length;

          // 2. Kiểm tra những người đã được Unlock (Auto-invited)
          const unlocks = await this.prisma.candidateUnlock.findMany({
            where: {
              jobPostingId: job.jobPostingId,
              recruiterId: recruiter.recruiterId,
            },
            include: {
              cv: {
                include: {
                  candidate: {
                    include: { user: { select: { avatar: true } } },
                  },
                },
              },
            },
            take: 5,
          });

          autoInvitedCandidates = unlocks.map((u) => ({
            candidateId: u.candidateId,
            fullName: u.cv.candidate.fullName,
            avatar: u.cv.candidate.user.avatar,
            unlockedAt: u.unlockedAt,
          }));
        }

        return {
          ...job,
          matchedCount,
          autoInvitedCandidates,
          branches: (job as any).branches.map((b: any) => b.branch),
        };
      }),
    );

    return enrichedJobs;
  }

  async findOne(id: string, userId?: string, trackView: boolean = true) {
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      );

    const job = await this.prisma.jobPosting.findFirst({
      where: isUuid ? { jobPostingId: id } : { slug: id },
      include: {
        company: true,
        recruiter: true,
        branches: {
          include: {
            branch: true,
          },
        },
        applications: { select: { applicationId: true } },
      },
    });

    if (!job)
      throw new NotFoundException(`Không tìm thấy Job với ID/Slug ${id}`);

    const flattenedJob: any = {
      ...job,
      branches: (job as any).branches.map((b: any) => b.branch),
    };

    let isRecipientCandidate = true;
    if (userId) {
      if (flattenedJob.recruiter?.userId === userId) {
        isRecipientCandidate = false;
      } else {
        // Check if it's a recruiter
        const isRec = await this.prisma.recruiter.findUnique({
          where: { userId },
        });
        if (isRec) isRecipientCandidate = false;
      }
    }

    // Increment view count asynchronously only if trackView is true and the viewer is NOT a recruiter
    if (trackView && isRecipientCandidate) {
      this.prisma.jobPosting
        .update({
          where: { jobPostingId: flattenedJob.jobPostingId },
          data: { viewCount: { increment: 1 } },
          select: { jobPostingId: true }, // Minimal return
        })
        .then(() => {
          if (flattenedJob.recruiter?.userId) {
            this.messagesGateway.server
              .to(`user_${flattenedJob.recruiter.userId}`)
              .emit('jdViewUpdated', { jobPostingId: flattenedJob.jobPostingId });
          }
        })
        .catch(console.error);
    }

    let hasApplied = false;
    let isSaved = false;
    let matchScore: number | null = null;

    if (userId) {
      const candidate = await this.prisma.candidate.findUnique({
        where: { userId },
      });
      if (candidate) {
        // Check Application
        const application = await this.prisma.application.findFirst({
          where: {
            jobPostingId: job.jobPostingId,
            candidateId: candidate.candidateId,
          },
        });
        hasApplied = !!application;

        // Check Saved
        const saved = await this.prisma.savedJob.findUnique({
          where: {
            candidateId_jobPostingId: {
              candidateId: candidate.candidateId,
              jobPostingId: job.jobPostingId,
            },
          },
        });
        isSaved = !!saved;
        // Check Match Score
        const match = await this.prisma.jobMatch.findUnique({
          where: {
            candidateId_jobPostingId: {
              candidateId: candidate.candidateId,
              jobPostingId: job.jobPostingId,
            },
          },
        });
        if (match) {
          matchScore = match.score;
        }
      }
    }

    return { ...flattenedJob, hasApplied, isSaved, matchScore };
  }

  getIndustries() {
    return HIERARCHICAL_INDUSTRIES;
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

      // Chỉ update nếu có sự thay đổi
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

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto, userId: string) {
    // Kiểm tra tồn tại trước khi update (dùng findUnique để không trigger trackView)
    const existingJob = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { recruiter: true }
    });
    if (!existingJob)
      throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);

    // Kiểm tra quyền sở hữu
    if (existingJob.recruiter?.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa tin này');
    }

    const { branchIds, hardSkills, softSkills, minExperienceYears, isAiGenerated, expandedSkills, ...rest } =
      updateJobPostingDto as any;

    // Kiểm tra blacklist khi cập nhật
    const { containsBadWords, foundWords } = this.validateBlacklist(
      updateJobPostingDto.title || existingJob.title,
      updateJobPostingDto.description || existingJob.description || '',
      updateJobPostingDto.requirements ||
      (existingJob.structuredRequirements as any)?.requirements,
      updateJobPostingDto.benefits ||
      (existingJob.structuredRequirements as any)?.benefits,
      hardSkills,
      softSkills,
    );

    const statusVal = (updateJobPostingDto as any).status;
    const isStatusOnlyUpdate =
      Object.keys(updateJobPostingDto).length === 1 && statusVal !== undefined;
    let newStatus: JobStatus = statusVal || existingJob.status;

    let modResult: any = null;
    let aiReliabilityScore: number | undefined;

    if (!isStatusOnlyUpdate) {
      if (containsBadWords) {
        newStatus = JobStatus.REJECTED;
        aiReliabilityScore = 40;
        modResult = {
          score: 40,
          safe: false,
          flags: foundWords,
          reason: 'Nội dung chứa từ khóa bị cấm.',
          feedback: ['Vui lòng loại bỏ các từ ngữ không phù hợp hoặc thông tin liên hệ cá nhân (số điện thoại, link mạng xã hội) khỏi mô tả.'],
        };
      } else {
        // Tái kiểm duyệt bằng AI
        modResult = await this.aiService.moderateJobContent(
          updateJobPostingDto.title || existingJob.title,
          updateJobPostingDto.description || existingJob.description || '',
          updateJobPostingDto.requirements || (existingJob.structuredRequirements as any)?.requirements || '',
          updateJobPostingDto.benefits || (existingJob.structuredRequirements as any)?.benefits || '',
          hardSkills || (existingJob.structuredRequirements as any)?.hardSkills || [],
          existingJob.jobTier
        );
        aiReliabilityScore = modResult.score;

        if (!modResult.safe || modResult.score < 50) {
          newStatus = JobStatus.REJECTED;
        } else if (modResult.score < 70) {
          newStatus = JobStatus.PENDING;
        } else {
          newStatus = JobStatus.APPROVED;
        }
      }
    }

    const currentStructured = (existingJob.structuredRequirements as any) || {};

    // Determine Industry Categories during update
    const finalHardSkills = hardSkills !== undefined ? hardSkills : (currentStructured.hardSkills || []);
    const categories = this.identifyCategories(
      updateJobPostingDto.title || existingJob.title || '',
      updateJobPostingDto.description || existingJob.description || '',
      finalHardSkills
    );

    const result = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...rest,
        status: newStatus,
        structuredRequirements: {
          ...currentStructured,
          ...(hardSkills !== undefined && { hardSkills }),
          ...(softSkills !== undefined && { softSkills }),
          ...(minExperienceYears !== undefined && { minExperienceYears }),
          ...(isAiGenerated !== undefined && { isAiGenerated }),
          ...(expandedSkills !== undefined && { expandedSkills }),
          ...(!isStatusOnlyUpdate && { categories }),
        },
        ...(modResult && { moderationFeedback: modResult }),
        ...(aiReliabilityScore !== undefined && { aiReliabilityScore }),
        ...(newStatus === JobStatus.APPROVED && { isVerified: true }),
        ...(branchIds && {
          branches: {
            deleteMany: {},
            create: branchIds.map((id: string) => ({ branchId: id })),
          },
        }),
        updatedAt: new Date(),
      },
      include: { company: true, recruiter: true },
    });

    // Nếu cập nhật dẫn đến vi phạm -> Cộng 1 lượt vi phạm
    if (newStatus === JobStatus.REJECTED && result.recruiterId) {
      await this.checkAndAutoLockRecruiter(result.recruiterId);

      // Thông báo cho nhà tuyển dụng
      const title = 'Tin tuyển dụng bị từ chối sau khi cập nhật';
      const message = `Tin tuyển dụng "${result.title}" của bạn đã bị từ chối do chứa từ khóa vi phạm mới: ${foundWords.join(', ')}.`;
      if (result.recruiter?.userId) {
        await this.notificationsService.create(
          result.recruiter.userId,
          title,
          message,
          'error',
          '/recruiter/jobs',
        );
        this.messagesGateway.server
          .to(`user_${result.recruiter.userId}`)
          .emit('notification', {
            title,
            message,
            type: 'error',
            link: '/recruiter/jobs',
          });
      }
    }

    // Update ES if approved
    if (result.status === JobStatus.APPROVED) {
      this.syncJobToES(result);
      // Trigger matching after update → bao gồm cả trường hợp bài được sửa và duyệt lại
      await this.matchingQueue.add('match', { jobId: id });
    } else {
      await this.searchService.deleteJob(id);
    }

    if (
      (existingJob.jobTier === 'PROFESSIONAL' ||
        existingJob.jobTier === 'URGENT') &&
      hardSkills !== undefined
    ) {
      this.enrichKeywordsInBackground(
        result.jobPostingId,
        result.title,
        hardSkills,
      );
    }

    return result;
  }

  async getAdminStats() {
    const [totalPending, totalApproved, totalRejected] =
      await Promise.all([
        this.prisma.jobPosting.count({ where: { status: 'PENDING' } }),
        this.prisma.jobPosting.count({ where: { status: 'APPROVED' } }),
        this.prisma.jobPosting.count({ where: { status: 'REJECTED' } }),
      ]);
    return { totalPending, totalApproved, totalRejected };
  }

  async findAllAdmin(query: AdminFilterJobPostingDto) {
    const {
      status,
      minAiScore,
      searchTerm,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (minAiScore !== undefined)
      where.aiReliabilityScore = { gte: minAiScore };

    if (searchTerm) {
      where.OR = [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        {
          company: {
            companyName: { contains: searchTerm, mode: 'insensitive' },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: { include: { user: { select: { email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return { items, total, page, limit };
  }
  async updateStatus(id: string, status: JobStatus, adminId: string, reason?: string) {
    const job = await this.findOne(id);

    let updated = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
        ...(status === JobStatus.REJECTED && reason && {
          moderationFeedback: {
            score: 0,
            safe: false,
            reason: reason,
            feedback: ['Admin đã từ chối tin tuyển dụng này thủ công.'],
          },
        }),
      },
      include: {
        recruiter: true,
        company: true,
      },
    });

    if (status === JobStatus.APPROVED) {
      // AI Feature cho PROFESSIONAL
      if (updated.jobTier === 'PROFESSIONAL') {
        const skills = await this.aiService.extractFocusSkills(
          updated.title,
          updated.description || '',
        );
        if (skills.length > 0) {
          const structured = (updated.structuredRequirements as any) || {};
          structured.focusSkills = skills;
          updated = await this.prisma.jobPosting.update({
            where: { jobPostingId: id },
            data: { structuredRequirements: structured },
            include: { recruiter: true, company: true },
          });
        }
      }

      // Feature URGENT
      if (updated.jobTier === 'URGENT') {
        this.pushUrgentNotifications(updated);
      }
    }

    if (updated.recruiter?.userId) {
      let title = '';
      let message = '';
      let type = 'info';

      if (status === JobStatus.APPROVED) {
        title = 'Tin tuyển dụng được duyệt';
        message = `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.`;
        type = 'success';
      } else if (status === JobStatus.REJECTED) {
        title = 'Tin tuyển dụng bị từ chối';
        message = `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
        type = 'error';
      }

      if (title) {
        await this.notificationsService.create(
          updated.recruiter.userId,
          title,
          message,
          type,
          '/recruiter/jobs',
        );
        this.messagesGateway.server
          .to(`user_${updated.recruiter.userId}`)
          .emit('notification', {
            title,
            message,
            type,
            link: '/recruiter/jobs',
          });
      }
    }

    // Không cộng điểm vi phạm khi admin từ chối thủ công (per user request).
    // Điểm vi phạm chỉ được cộng khi tin bị phát hiện vi phạm từ khóa (trong hàm create/update).

    if (status === JobStatus.APPROVED) {
      this.syncJobToES(updated);
      await this.matchingQueue.add('match', { jobId: id });
    } else {
      await this.searchService.deleteJob(id);
    }

    this.messagesGateway.server.emit('adminJobUpdated');

    return updated;
  }

  async removeBulk(ids: string[]) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException(
        'Vui lòng cung cấp danh sách ID để xóa hàng loạt.',
      );
    }

    const result = await this.prisma.jobPosting.deleteMany({
      where: { jobPostingId: { in: ids } },
    });
    this.messagesGateway.server.emit('adminJobUpdated');
    return {
      message: `Đã xóa thành công ${result.count} tin tuyển dụng.`,
      count: result.count,
    };
  }

  async updateStatusBulk(ids: string[], status: JobStatus, adminId: string) {
    if (!ids || ids.length === 0) {
      throw new ForbiddenException(
        'Vui lòng cung cấp danh sách ID để thao tác hàng loạt.',
      );
    }

    const where = { jobPostingId: { in: ids } };

    // Find all affected jobs before update to send notifications
    const jobsToUpdate = await this.prisma.jobPosting.findMany({
      where,
      include: { recruiter: true },
    });

    const result = await this.prisma.jobPosting.updateMany({
      where,
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
      },
    });

    // Notifications for Bulk Update
    for (const job of jobsToUpdate) {
      if (job.recruiter?.userId) {
        let title = '';
        let message = '';
        let type = 'info';

        if (status === JobStatus.APPROVED) {
          title = 'Tin tuyển dụng được duyệt';
          message = `Tin tuyển dụng "${job.title}" của bạn đã được Admin phê duyệt.`;
          type = 'success';
        } else if (status === JobStatus.REJECTED) {
          title = 'Tin tuyển dụng bị từ chối';
          message = `Tin tuyển dụng "${job.title}" của bạn đã bị Admin từ chối.`;
          type = 'error';
        }

        if (title) {
          await this.notificationsService.create(
            job.recruiter.userId,
            title,
            message,
            type,
            '/recruiter/jobs',
          );
          this.messagesGateway.server
            .to(`user_${job.recruiter.userId}`)
            .emit('notification', {
              title,
              message,
              type,
              link: '/recruiter/jobs',
            });
        }
      }
    }
    if (status === JobStatus.APPROVED) {
      // For bulk, we need to fetch the actual jobs to match keywords
      const approvedJobs = await this.prisma.jobPosting.findMany({
        where: { ...where, status: JobStatus.APPROVED },
      });
      for (const job of approvedJobs) {
        this.triggerJobNotifications(job);
        this.syncJobToES(job);
      }
    } else {
      // If bulk reject/expire, remove from ES
      const jobsToProcess = await this.prisma.jobPosting.findMany({
        where: { ...where },
      });
      for (const job of jobsToProcess) {
        await this.searchService.deleteJob(job.jobPostingId);
      }
    }

    // Không cộng điểm vi phạm khi admin từ chối thủ công.

    this.messagesGateway.server.emit('adminJobUpdated');

    return {
      message: `Đã cập nhật trạng thái thành công cho ${result.count} tin tuyển dụng.`,
      count: result.count,
    };
  }

  /**
   * Tăng vi phạm (violationCount).
   * Nếu vượt ngưỡng (VIOLATION_LIMIT) → khóa tài khoản, gửi thông báo realtime.
   */
  private async checkAndAutoLockRecruiter(recruiterId: string): Promise<void> {
    console.log(
      `[VIOLATION] Incrementing violation for recruiter: ${recruiterId}`,
    );
    const updated = await this.prisma.recruiter.update({
      where: { recruiterId },
      data: { violationCount: { increment: 1 } },
      include: { user: true },
    });
    console.log(
      `[VIOLATION] Current count for ${recruiterId}: ${updated.violationCount}`,
    );

    const newCount = updated.violationCount;
    this.messagesGateway.server.emit('adminUserUpdated', {
      email: updated.user.email,
    });

    if (newCount < this.VIOLATION_LIMIT) {
      // Gửi cảnh báo nhưng chưa khóa
      const remaining = this.VIOLATION_LIMIT - newCount;
      await this.notificationsService.create(
        updated.userId,
        `⚠️ Cảnh báo vi phạm (${newCount}/${this.VIOLATION_LIMIT})`,
        `Tin tuyển dụng của bạn đã bị từ chối. Bạn còn ${remaining} lần trước khi tài khoản bị khóa vĩnh viễn.`,
        'warning',
        '/recruiter/jobs',
      );
      this.messagesGateway.server
        .to(`user_${updated.userId}`)
        .emit('notification', {
          title: `⚠️ Cảnh báo vi phạm (${newCount}/${this.VIOLATION_LIMIT})`,
          message: `Tin tuyển dụng của bạn vừa bị từ chối. Còn ${remaining} lần nữa tài khoản sẽ bị khóa.`,
          type: 'warning',
          link: '/recruiter/jobs',
        });
      return;
    }

    // Đạt ngưỡng -> khóa tài khoản
    await this.prisma.user.update({
      where: { userId: updated.userId },
      data: { status: 'LOCKED' },
    });

    // Reset bộ đếm sau khi khóa để admin có thể mở khóa và recruiter có cơ hội xây dựng lại
    await this.prisma.recruiter.update({
      where: { recruiterId },
      data: { violationCount: 0 },
    });

    // Thông báo khóa + force logout qua socket
    await this.notificationsService.create(
      updated.userId,
      '🔒 Tài khoản bị khóa do vi phạm liên tục',
      `Tài khoản của bạn đã bị khóa vì đăng lên ${this.VIOLATION_LIMIT} tin vi phạm liên tiếp. Vui lòng liên hệ quản trị viên để kháng cáo.`,
      'error',
    );
    this.messagesGateway.server
      .to(`user_${updated.userId}`)
      .emit('accountLocked');

    this.messagesGateway.server.emit('adminAccountLocked', {
      email: updated.user.email,
    });
  }

  async remove(id: string) {
    const job = await this.findOne(id);
    await this.prisma.jobPosting.delete({
      where: { jobPostingId: id },
    });
    await this.searchService.deleteJob(id);
    return { success: true };
  }

  private async triggerJobNotifications(job: any) {
    try {
      const alerts = await this.jobAlertsService.findAllAlerts();
      const matchedAlerts = alerts.filter((alert) =>
        job.title.toLowerCase().includes(alert.keywords.toLowerCase()),
      );

      for (const alert of matchedAlerts) {
        await this.notificationsService.create(
          alert.userId,
          'Việc làm mới theo từ khóa của bạn',
          `Có 1 việc làm mới theo từ khóa tìm kiếm "${alert.keywords}". Vào xem ngay`,
          'info',
        );
      }
    } catch (error) {
      console.error('Error triggering notifications:', error);
    }
  }

  private async syncJobToES(job: any) {
    await this.searchService.indexJob({
      id: job.jobPostingId,
      title: job.title,
      description: job.description,
      companyId: job.companyId,
      companyName: job.company?.companyName || undefined,
      originalUrl: job.originalUrl,
      locationCity: job.locationCity,
      jobType: job.jobType,
      experience: job.experience,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : undefined,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : undefined,
      createdAt: job.createdAt,
      refreshedAt: job.refreshedAt,
      jobTier: job.jobTier,
      status: job.status,
      industry: (job.structuredRequirements as any)?.categories?.[0] || 'Đa lĩnh vực / Khác',
    });
  }

  private async pushUrgentNotifications(job: any) {
    try {
      const activeCandidates = await this.prisma.candidate.findMany({
        take: 10,
      });
      for (const c of activeCandidates) {
        if (c.userId) {
          await this.notificationsService.create(
            c.userId,
            '🔥 Cơ hội việc làm Tuyển Gấp!',
            `Công ty ${job.company?.companyName || 'đối tác'} đang tuyển gấp vị trí "${job.title}". Hãy apply ngay!`,
            'info',
            `/jobs/${job.jobPostingId}`,
          );
          this.messagesGateway.server
            .to(`user_${c.userId}`)
            .emit('notification', {
              title: '🔥 Cơ hội việc làm Tuyển Gấp!',
              message: `Công ty ${job.company?.companyName || 'đối tác'} đang tuyển gấp vị trí "${job.title}". Hãy apply ngay!`,
              type: 'info',
              link: `/jobs/${job.jobPostingId}`,
            });
        }
      }
    } catch (e) {
      console.error('Lỗi khi push urgent notif', e);
    }
  }

  @Cron('0 0 * * *')
  async refreshGrowthJobs() {
    console.log('[Cron] Checking for GROWTH jobs to refresh...');
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const jobs = await this.prisma.jobPosting.findMany({
      where: {
        status: JobStatus.APPROVED,
        refreshedAt: { lte: fortyEightHoursAgo },
        recruiter: {
          recruiterSubscription: {
            planType: 'GROWTH',
            expiryDate: { gt: new Date() },
          },
        },
      },
    });

    if (jobs.length > 0) {
      console.log(`[Cron] Found ${jobs.length} GROWTH jobs to refresh.`);
      const ids = jobs.map((j) => j.jobPostingId);

      await this.prisma.jobPosting.updateMany({
        where: { jobPostingId: { in: ids } },
        data: { refreshedAt: new Date() },
      });

      const updatedJobs = await this.prisma.jobPosting.findMany({
        where: { jobPostingId: { in: ids } },
        include: { company: true },
      });

      for (const j of updatedJobs) {
        await this.syncJobToES(j);
      }
    }
  }

  async syncAllJobsToES() {
    // Xóa và tạo lại index để đảm bảo dữ liệu sạch 100%
    await this.searchService.recreateIndex();

    const jobs = await this.prisma.jobPosting.findMany({
      where: { status: JobStatus.APPROVED },
      include: { company: true },
    });

    console.log(`[JobPostingsService] Syncing ${jobs.length} jobs to ES...`);
    for (const job of jobs) {
      await this.syncJobToES(job);
    }
    return { count: jobs.length };
  }

  async getSuggestedCandidates(jobId: string, recruiterIdFromToken?: string) {
    const jobPost = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      select: { status: true, structuredRequirements: true },
    });

    if (jobPost?.status === 'REJECTED') {
      return [];
    }

    const matches = await this.matchingOrchestrator.runMatchingForJob(jobId);

    // We need recruiterId to check if unlocked
    let recruiterId: string | null = null;
    if (recruiterIdFromToken) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId: recruiterIdFromToken },
      });
      if (recruiter) recruiterId = recruiter.recruiterId;
    }

    // Lấy danh sách đã mở khóa
    const unlockedIds = new Set();
    if (recruiterId) {
      const unlocked = await this.prisma.candidateUnlock.findMany({
        where: { recruiterId, jobPostingId: jobId },
        select: { candidateId: true },
      });
      unlocked.forEach((u) => unlockedIds.add(u.candidateId));
    }

    // Enrich with minimum candidate details for the dashboard
    const enriched = await Promise.all(
      matches.map(async (m) => {
        const isUnlocked = unlockedIds.has(m.candidateId);
        const candidate = await this.prisma.candidate.findUnique({
          where: { candidateId: m.candidateId },
          include: {
            user: { select: { avatar: true, email: true } },
            cvs: {
              where: { parsedData: { not: Prisma.JsonNull } },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
        });

        // Tính toán kỹ năng thiếu (Missing Skills)
        const jobReqs = jobPost?.structuredRequirements as any;
        const candidateSkills = (candidate?.cvs?.[0]?.parsedData as any)?.skills || [];
        const hardSkills = jobReqs?.hardSkills || [];

        const missingSkills = hardSkills.filter(s =>
          !m.matchedSkills.some(ms => ms.toLowerCase().includes(s.toLowerCase()))
        );

        return {
          ...m,
          fullName: isUnlocked
            ? candidate?.fullName || 'Ứng viên'
            : `Ứng viên #${m.candidateId.slice(0, 4)}`,
          email: isUnlocked ? candidate?.user?.email : '***@***.***',
          major: candidate?.major || '',
          user: { avatar: isUnlocked ? candidate?.user?.avatar : null },
          isUnlocked,
          missingSkills,
          // Thêm thông tin cho bảng phân tích
          analysis: {
            hardSkillsCount: hardSkills.length,
            matchedCount: m.matchedSkills.length,
            missingCount: missingSkills.length,
            experienceMatch: (candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp >= (jobReqs?.minExperienceYears || 0),
            totalYearsExp: (candidate?.cvs?.[0]?.parsedData as any)?.totalYearsExp || 0,
            requiredExp: jobReqs?.minExperienceYears || 0
          }
        };
      }),
    );

    // Return top 10 matches
    return enriched.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  async getRecommendations(userId: string) {
    return this.matchingOrchestrator.runMatchingForCandidate(userId);
  }

  private validateBlacklist(
    title: string,
    description: string,
    requirements?: string,
    benefits?: string,
    hardSkills?: string[],
    softSkills?: string[],
  ): { containsBadWords: boolean; foundWords: string[] } {
    const blacklist = [
      'cá cược',
      'đánh bạc',
      'cờ bạc',
      'lừa đảo',
      'việc nhẹ lương cao',
      'đa cấp',
    ];

    const contentToCheck = [
      title,
      description,
      requirements || '',
      benefits || '',
      ...(hardSkills || []),
      ...(softSkills || []),
    ]
      .join(' ')
      .toLowerCase();

    const foundBadWords = blacklist.filter((word) =>
      contentToCheck.includes(word),
    );

    // Thêm kiểm tra evasion keywords (Zalo, SĐT, Social links)
    const evasionMatch = contentToCheck.match(EVASION_REGEX);
    if (evasionMatch && !foundBadWords.includes(evasionMatch[0])) {
      foundBadWords.push(evasionMatch[0]);
    }

    return {
      containsBadWords: foundBadWords.length > 0,
      foundWords: foundBadWords,
    };
  }

  async reparse(id: string, userId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { recruiter: true },
    });

    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng');
    if (job.recruiter?.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    this.logger.log(`Reparsing Job ID: ${id}`);

    try {
      // 1. Bóc tách lại kỹ năng từ tiêu đề và yêu cầu
      const hardSkills = await this.aiService.extractFocusSkills(
        job.title,
        job.requirements || '',
      );

      // 2. Dự đoán lại số năm kinh nghiệm (Prompt tối ưu qua AI)
      const prompt = `Dựa trên văn bản yêu cầu công việc sau, hãy xác định số năm kinh nghiệm tối thiểu yêu cầu.
      QUY TẮC QUAN TRỌNG:
      - Nếu Tiêu đề hoặc Mô tả có chứa các từ khóa: "Intern", "Thực tập sinh", "Junior", "Fresher", "Mới tốt nghiệp", "Không yêu cầu kinh nghiệm" -> Trả về 0.
      - Các trường hợp khác: Trả về con số nhỏ nhất được nhắc đến cho số năm kinh nghiệm.
      - TRẢ VỀ DUY NHẤT 1 CON SỐ.

      Tiêu đề: ${job.title}
      Yêu cầu: ${job.requirements}
      Mô tả: ${job.description}`;

      let minExperienceYears = 0;
      try {
        const aiResponse = await this.aiService.generateResponse(prompt);
        const match = aiResponse.match(/\d+/);
        if (match) minExperienceYears = parseInt(match[0]);
      } catch (e) {
        this.logger.warn('Failed to parse experience via AI, defaulting to 0');
      }

      const currentStruct = (job.structuredRequirements as any) || {};
      const updatedStruct = {
        ...currentStruct,
        hardSkills,
        minExperienceYears,
      };

      const updatedJob = await this.prisma.jobPosting.update({
        where: { jobPostingId: id },
        data: {
          structuredRequirements: updatedStruct,
        },
      });

      // 3. Mở rộng từ khóa (Keywords Expansion) ngầm
      await this.enrichKeywordsInBackground(id, job.title, hardSkills);

      // 4. Đồng bộ ES
      try {
        await this.syncJobToES(updatedJob as any);
      } catch (e) {
        this.logger.error('ES Sync failed during reparse:', e);
      }

      // 5. Trigger Matching
      await this.matchingQueue.add('match', { jobId: id });

      return {
        success: true,
        message: 'Đã bóc tách lại dữ liệu thành công',
        newRequirements: updatedStruct,
      };
    } catch (error) {
      this.logger.error(`Reparse failed for Job ${id}: ${error.message}`);
      throw new Error('Không thể bóc tách lại dữ liệu lúc này');
    }
  }

  async renew(jobId: string, userId: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      include: { recruiter: true },
    });

    if (!job) throw new NotFoundException('Tin tuyển dụng không tồn tại');
    if (job.recruiter?.userId !== userId)
      throw new ForbiddenException('Bạn không có quyền gia hạn tin này');
    if ((job.status as any) !== 'EXPIRED' && (job.status as any) !== 'CLOSED') {
      throw new ForbiddenException(
        'Chỉ có thể gia hạn tin đã hết hạn hoặc đã khóa',
      );
    }

    // Trừ quota vì gia hạn coi như dùng lượt
    await this.subscriptionsService.checkPermissionAndDeduct(
      userId,
      job.jobTier,
    );

    // Renew = gia hạn -> Tạo mốc ngày giờ mới và gán lại APPROVED
    const updatedJob = await this.prisma.jobPosting.update({
      where: { jobPostingId: jobId },
      data: {
        status: 'APPROVED',
        createdAt: new Date(),
        refreshedAt: new Date(),
      },
      include: { company: true, recruiter: { include: { user: true } } },
    });

    try {
      await this.syncJobToES(updatedJob);
    } catch (e) {
      console.error('ES Sync failed on renew', e);
    }

    return updatedJob;
  }

  async getCategoryStats() {
    const stats: Record<string, number> = {};

    await Promise.all(
      HIERARCHICAL_INDUSTRIES.map(async (cat) => {
        const count = await this.prisma.jobPosting.count({
          where: {
            status: 'APPROVED' as JobStatus,
            structuredRequirements: {
              path: ['categories'],
              array_contains: [cat.category],
            },
          },
        });
        stats[cat.category] = count;
      }),
    );

    return stats;
  }
  async suggestCategories(title: string, description?: string, skills?: string[]) {
    return this.identifyCategories(title, description, skills);
  }

  identifyCategories(title: string, description?: string, skills?: string[]): string[] {
    const textToAnalyze = `${title} ${description || ''} ${skills?.join(' ') || ''}`.toLowerCase();
    const suggestions = new Set<string>();

    // 1. Phân tích dựa trên HIERARCHICAL_INDUSTRIES
    HIERARCHICAL_INDUSTRIES.forEach(group => {
      let matchedGroup = false;

      // Check top-level keywords
      if (group.keywords.some(kw => textToAnalyze.includes(kw.toLowerCase()))) {
        suggestions.add(group.category);
        matchedGroup = true;
      }

      // Check subcategories names as keywords
      group.subCategories.forEach(sub => {
        // Lấy phần text trong ngoặc hoặc trước ngoặc để match
        const subClean = sub.replace(/\(.*\)/, '').trim().toLowerCase();
        if (textToAnalyze.includes(subClean) || (sub.includes('/') && sub.split('/').some(p => textToAnalyze.includes(p.trim().toLowerCase())))) {
          suggestions.add(sub);
          suggestions.add(group.category); // Luôn thêm category cha nếu trúng sub
          matchedGroup = true;
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
}
