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
import { JobStatus, Prisma } from '../../../generated/prisma';
import { AdminFilterJobPostingDto } from './dto/admin-filter-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { MessagesGateway } from '../../messages/messages.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { JobAlertsService } from '../../job-alerts/job-alerts.service';
import { SearchService } from '../../search/search.service';
import { MatchingService } from '../../search/matching.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AiService } from '../../ai/ai.service';
import { SubscriptionsService } from '../../subscriptions/subscriptions.service';

export const HIERARCHICAL_INDUSTRIES = [
  {
    category: 'Kinh Doanh/Bán Hàng',
    subCategories: [
      'Bán Hàng Doanh Nghiệp - B2B',
      'Bán Hàng Cá Nhân - B2C',
      'Telesales - Bán Hàng Online',
      'Phát Triển Kinh Doanh',
      'Bán Hàng Kỹ Thuật',
      'Hỗ Trợ Kinh Doanh - Sales Admin',
      'Bán Hàng Kênh Phân Phối - Đại Lý',
      'Sales Marketing - PR - Quảng Cáo',
      'Sales Công Nghệ Thông Tin',
      'Sales Xây Dựng - Vật Liệu',
      'Sales Logistics',
      'Sales Viễn Thông',
    ],
    keywords: ['sales', 'kinh doanh', 'bán hàng', 'b2b', 'b2c', 'telesales', 'phát triển kinh doanh', 'sales admin', 'phân phối', 'đại lý', 'sales marketing', 'sales it', 'sales logistics'],
  },
  {
    category: 'Marketing/PR/Quảng Cáo',
    subCategories: [
      'Sáng Tạo Nội Dung',
      'Quảng Cáo - Sáng Tạo',
      'Trade - Brand - Product Marketing',
      'PR - Truyền Thông - Sự Kiện',
      'Nghiên Cứu Thị Trường',
      'Digital Marketing',
      'Sales Marketing - PR - Quảng Cáo',
    ],
    keywords: ['marketing', 'pr', 'quảng cáo', 'content creator', 'sáng tạo', 'brand', 'product marketing', 'truyền thông', 'sự kiện', 'market research', 'digital marketing', 'seo', 'ads'],
  },
  {
    category: 'Công Nghệ Thông Tin',
    subCategories: [
      'Quản Lý Sản Phẩm IT',
      'Quản Lý Dự Án IT',
      'Kiểm Thử Phần Mềm',
      'Dữ Liệu - AI - Học Máy',
      'An Toàn Thông Tin - An Ninh Mạng',
      'Hạ Tầng - Mạng',
      'Vận Hành IT - IT Helpdesk',
      'Triển Khai Giải Pháp IT',
      'DevOps - Cloud',
      'Phần Cứng - Lập Trình Nhúng',
      'Lập Trình - Phát Triển Phần Mềm',
      'Fintech',
      'Phân Tích Nghiệp Vụ (BA)',
      'Sales Công Nghệ Thông Tin',
    ],
    keywords: ['it', 'công nghệ thông tin', 'software', 'phần mềm', 'tester', 'qa', 'data science', 'ai', 'machine learning', 'security', 'cybersecurity', 'network', 'helpdesk', 'devops', 'cloud', 'embedded', 'lập trình', 'fintech', 'ba', 'business analyst'],
  },
  {
    category: 'Hành Chính/Văn Phòng',
    subCategories: [
      'Thư Ký - Trợ Lý',
      'Hành Chính Tổng Hợp',
      'Lễ Tân',
      'Nhập Liệu - Lưu Trữ',
    ],
    keywords: ['hành chính', 'văn phòng', 'thư ký', 'trợ lý', 'lễ tân', 'nhập liệu', 'admin', 'office management'],
  },
  {
    category: 'Kế Toán/Kiểm Toán',
    subCategories: [
      'Kế Toán - Kế Toán Tổng Hợp',
      'Kế Toán Thuế - Kế Toán Chi Phí',
      'Kiểm Toán - Kiểm Soát Nội Bộ',
      'Tài Chính Kế Toán',
    ],
    keywords: ['kế toán', 'kiểm toán', 'tài chính', 'accounting', 'audit', 'thuế', 'tax', 'chi phí', 'internal control'],
  },
  {
    category: 'Nhân Sự',
    subCategories: [
      'Hành Chính Nhân Sự',
      'Tuyển Dụng',
      'Đào Tạo & Phát Triển (L&D)',
      'Lương & Phúc Lợi (C&B)',
      'Đối Tác Nhân Sự (HRBP)',
    ],
    keywords: ['nhân sự', 'hr', 'tuyển dụng', 'recruitment', 'l&d', 'đào tạo', 'c&b', 'lương', 'phúc lợi', 'hrbp'],
  },
  {
    category: 'Điện/Điện Tử/Năng Lượng',
    subCategories: [
      'Vận Hành - Bảo Trì - Sửa Chữa',
      'Điện Lạnh - HVAC',
      'Điện Tử - Vi Mạch - Bán Dẫn',
      'Năng Lượng - Năng Lượng Tái Tạo',
      'Điện - Điện Công Nghiệp',
      'Điện Dân Dụng',
    ],
    keywords: ['điện', 'điện tử', 'năng lượng', 'bảo trì', 'sửa chữa', 'điện lạnh', 'hvac', 'vi mạch', 'bán dẫn', 'năng lượng tái tạo', 'solar'],
  },
  {
    category: 'Xây Dựng/Kiến Trúc/Nội Thất',
    subCategories: [
      'Cơ Điện - M&E',
      'Nội Thất - Cảnh Quan',
      'Kiến Trúc - Quy Hoạch',
      'Thi Công - Giám Sát Công Trình',
      'Kỹ Thuật Xây Dựng - Kết Cấu',
      'Dự Toán - Hồ Sơ Thầu (QS)',
      'Sales Xây Dựng - Vật Liệu',
    ],
    keywords: ['xây dựng', 'kiến trúc', 'nội thất', 'm&e', 'cơ điện', 'cảnh quan', 'quy hoạch', 'giám sát', 'kết cấu', 'qs', 'vật liệu xây dựng'],
  },
  {
    category: 'Cơ Khí/Ô Tô/Tự Động Hoá',
    subCategories: [
      'Tự Động Hóa - Robot',
      'Cơ Khí - Chế Tạo Máy',
      'Cơ Điện Tử',
      'Kỹ Thuật Ô Tô',
    ],
    keywords: ['cơ khí', 'ô tô', 'tự động hóa', 'robot', 'chế tạo máy', 'cơ điện tử', 'automotive', 'mechatronics'],
  },
  {
    category: 'Nhà Hàng/Khách sạn/Du Lịch',
    subCategories: [
      'Du Lịch - Lữ Hành',
      'Khách Sạn',
      'Nhà Hàng - F&B',
    ],
    keywords: ['nhà hàng', 'khách sạn', 'du lịch', 'f&b', 'lữ hành', 'hospitality', 'tourism', 'chef', 'phục vụ'],
  },
  {
    category: 'Sản Xuất/Lắp Ráp/Chế Biến',
    subCategories: [
      'In Ấn - Chế Bản',
      'Quản Lý Chất Lượng Sản Xuất',
      'Quản Lý Sản Xuất',
      'Kỹ Thuật Sản Xuất - Bảo Trì',
      'Vận Hành Máy - Lắp Ráp - Chế Biến',
    ],
    keywords: ['sản xuất', 'lắp ráp', 'chế biến', 'in ấn', 'qc', 'qa', 'quản lý sản xuất', 'vận hành máy', 'bảo trì'],
  },
  {
    category: 'Chuỗi Cung Ứng/Kho Vận/Xuất Nhập Khẩu',
    subCategories: [
      'Quản Lý Nhà Cung Cấp - Đấu Thầu',
      'Xuất Nhập Khẩu',
      'Phụ Xe - Bốc Xếp',
      'Lái Xe - Giao Nhận',
      'Quản Lý Kho',
      'Thu Mua',
      'Vận Tải',
      'Điều Phối Vận Tải',
      'Hoạch Định Chuỗi Cung Ứng',
      'Sales Logistics',
    ],
    keywords: ['logistics', 'chuỗi cung ứng', 'kho vận', 'xuất nhập khẩu', 'import export', 'kho', 'warehouse', 'thu mua', 'procurement', 'vận tải', 'supply chain'],
  },
  {
    category: 'Chăm Sóc Khách Hàng',
    subCategories: [
      'Dịch Vụ Khách Hàng',
      'Quản Lý Thành Công Khách Hàng',
      'Trải Nghiệm Khách Hàng',
    ],
    keywords: ['chăm sóc khách hàng', 'customer service', 'cskh', 'customer success', 'customer experience'],
  },
  {
    category: 'Thiết Kế',
    subCategories: [
      'Thiết Kế Giao Diện - UI-UX',
      'Thiết Kế Sản Phẩm - Công Nghiệp',
      'Thiết Kế Đồ Họa',
      'Thiết Kế Game',
      'Thiết Kế Thời Trang',
    ],
    keywords: ['thiết kế', 'design', 'ui', 'ux', 'đồ họa', 'graphic design', 'game design', 'fashion design'],
  },
  {
    category: 'An Toàn Lao Động/Môi trường (HSE)',
    subCategories: [
      'An Toàn Lao Động',
      'Môi Trường',
      'Phát Triển Bền Vững - ESG',
      'Phòng Cháy Chữa Cháy',
      'Sức Khỏe Nghề Nghiệp',
    ],
    keywords: ['hse', 'an toàn lao động', 'môi trường', 'esg', 'pccc', 'sức khỏe nghề nghiệp', 'safety'],
  },
  {
    category: 'Tài Chính/Ngân Hàng/Chứng Khoán',
    subCategories: [
      'Đầu Tư - Chứng Khoán - Quản Lý Quỹ',
      'Ngân Hàng',
      'Tài Chính Doanh Nghiệp',
      'Quản Trị Rủi Ro Tài Chính',
    ],
    keywords: ['tài chính', 'ngân hàng', 'chứng khoán', 'đầu tư', 'investment', 'banking', 'finance', 'risk management'],
  },
  {
    category: 'Y Tế/Sức khoẻ/Dược Phẩm',
    subCategories: [
      'Dược',
      'Y Tá - Điều Dưỡng',
      'Bác Sĩ',
      'Thể Thao - Fitness',
      'Thú Y',
      'Sức Khỏe - Dinh Dưỡng',
      'Kỹ Thuật Y Học - Xét Nghiệm',
      'Sales Y Tế - Dược Phẩm',
      'Thiết Bị Y Tế',
      'Vật Lý Trị Liệu',
    ],
    keywords: ['y tế', 'sức khỏe', 'dược', 'bác sĩ', 'y tá', 'điều dưỡng', 'fitness', 'thú y', 'dinh dưỡng', 'xét nghiệm', 'thiết bị y tế'],
  },
  {
    category: 'Bán Sỉ/Bán Lẻ/Quản Lý Cửa Hàng',
    subCategories: [
      'Bán Lẻ - Cửa Hàng',
      'Phát Triển Kênh Phân Phối - Bán Sỉ',
      'Quản Lý Ngành Hàng',
      'Thương Mại Điện Tử',
    ],
    keywords: ['bán lẻ', 'bán sỉ', 'retail', 'wholesale', 'e-commerce', 'thương mại điện tử', 'quản lý cửa hàng'],
  },
  {
    category: 'Viễn Thông',
    subCategories: [
      'Triển Khai - Vận Hành Mạng',
      'Kỹ Thuật Mạng Lõi - Truyền Dẫn',
      'Kỹ Thuật Vô Tuyến - Tối Ưu Mạng',
      'Sales Viễn Thông',
    ],
    keywords: ['viễn thông', 'telecom', 'mạng', 'network', 'truyền dẫn', 'vô tuyến'],
  },
  {
    category: 'Luật/Pháp Chế',
    subCategories: [
      'Tư Vấn Luật',
      'Pháp Chế Doanh Nghiệp',
      'Sở Hữu Trí Tuệ',
      'Tuân Thủ - Pháp Lý',
    ],
    keywords: ['luật', 'legal', 'pháp lý', 'pháp chế', 'sở hữu trí tuệ', 'compliance'],
  },
  {
    category: 'Biên Phiên Dịch',
    subCategories: [
      'Biên Dịch',
      'Phiên Dịch',
    ],
    keywords: ['biên dịch', 'phiên dịch', 'translation', 'interpretation', 'ngôn ngữ'],
  },
  {
    category: 'Giáo Dục/Đào Tạo',
    subCategories: [
      'Giảng Dạy - Trợ Giảng',
      'Tư Vấn Tuyển Sinh - Du Học',
      'Quản Lý Đào Tạo - Giáo Vụ',
    ],
    keywords: ['giáo dục', 'đào tạo', 'giảng dạy', 'trợ giảng', 'du học', 'tuyển sinh', 'education', 'training'],
  },
  {
    category: 'Lao Động Phổ Thông',
    subCategories: [
      'Bảo Vệ - An Ninh',
      'Vệ Sinh - Tạp Vụ',
      'Thợ Nghề',
      'Công Nhân',
      'Phụ Việc',
      'Lao Động Phổ Thông Khác',
    ],
    keywords: ['lao động phổ thông', 'bảo vệ', 'vệ sinh', 'công nhân', 'thợ', 'tạp vụ'],
  },
  {
    category: 'Bảo Hiểm',
    subCategories: [
      'Tư Vấn Bảo Hiểm',
      'Định Phí - Tái Bảo Hiểm',
      'Giám Định - Bồi Thường',
      'Phát Triển Sản Phẩm Bảo Hiểm',
    ],
    keywords: ['bảo hiểm', 'insurance', 'tư vấn bảo hiểm', 'bồi thường'],
  },
  {
    category: 'Bất Động Sản',
    subCategories: [
      'Tư Vấn Bất Động Sản',
      'Phát Triển Dự Án - Mặt Bằng',
      'Quản Lý - Vận Hành Tòa Nhà',
      'Thẩm Định Giá - Đầu Tư BĐS',
    ],
    keywords: ['bất động sản', 'real estate', 'môi giới', 'đầu tư bđs', 'quản lý tòa nhà'],
  },
  {
    category: 'Khoa Học/Kỹ Thuật',
    subCategories: [
      'Mỏ - Địa Chất - Khoáng Sản',
      'Sinh Học',
      'Hóa Học',
      'Công Nghệ Thực Phẩm',
      'Nghiên Cứu & Phát Triển (R&D)',
      'Trắc Địa - Bản Đồ',
      'Kỹ Thuật Ứng Dụng - Hiện Trường',
      'Phòng Thí Nghiệm',
      'Quản Lý Chất Lượng - Phòng Lab',
    ],
    keywords: ['khoa học', 'kỹ thuật', 'r&d', 'địa chất', 'sinh học', 'hóa học', 'thực phẩm', 'lab', 'phòng thí nghiệm'],
  },
  {
    category: 'Giao Thông Vận Tải',
    subCategories: [
      'Hàng Không',
      'Hàng Hải',
      'Đường Sắt - Metro',
    ],
    keywords: ['giao thông', 'vận tải', 'hàng không', 'hàng hải', 'đường sắt', 'metro', 'aviation', 'marine'],
  },
  {
    category: 'Mỹ Phẩm/Spa/Làm Đẹp',
    subCategories: [
      'Tư Vấn Mỹ Phẩm - Thẩm Mỹ',
      'Dịch Vụ Làm Đẹp - Spa',
    ],
    keywords: ['mỹ phẩm', 'spa', 'làm đẹp', 'beauty', 'thẩm mỹ'],
  },
  {
    category: 'Truyền Hình/Báo Chí',
    subCategories: [
      'Báo Chí - Phóng Viên',
      'Biên Tập - Sản Xuất Nội Dung',
      'Xuất Bản',
    ],
    keywords: ['báo chí', 'truyền hình', 'phóng viên', 'biên tập', 'nội dung', 'media', 'journalism'],
  },
  {
    category: 'Sáng Tạo/Nghệ Thuật',
    subCategories: [
      'Hội Họa - Điêu Khắc',
      'Nghiên Ảnh - Quay Dựng',
      'Âm Nhạc - Biểu Diễn',
      'Sáng Tác - Biên Kịch',
    ],
    keywords: ['nghệ thuật', 'sáng tạo', 'âm nhạc', 'hội họa', 'quay dựng', 'biên kịch', 'art', 'creative'],
  },
  {
    category: 'Nông/Lâm/Ngư Nghiệp',
    subCategories: [
      'Chăn Nuôi',
      'Trồng Trọt - Lâm Nghiệp',
      'Thủy Sản - Ngư Nghiệp',
    ],
    keywords: ['nông nghiệp', 'lâm nghiệp', 'ngư nghiệp', 'thủy sản', 'chăn nuôi', 'trồng trọt'],
  },
  {
    category: 'Dệt May/Da Giày/Thời Trang',
    subCategories: [
      'Sản Xuất Ngành Thời Trang - May Mặc',
      'Kỹ Thuật Rập - Cắt May',
      'Quản Lý Chất Lượng Dệt May',
      'Thiết Kế - Phát Triển Mẫu',
    ],
    keywords: ['dệt may', 'da giày', 'thời trang', 'may mặc', 'fashion', 'textile'],
  },
  {
    category: 'Ngành Nghề Khác',
    subCategories: [
      'Tổ Chức Phi Chính Phủ - Phi Lợi Nhuận',
    ],
    keywords: ['ngo', 'phi chính phủ', 'phi lợi nhuận', 'others'],
  },
];

@Injectable()
export class JobPostingsService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
    private jobAlertsService: JobAlertsService,
    private searchService: SearchService,
    private matchingService: MatchingService,
    @InjectQueue('matching') private matchingQueue: Queue,
    private aiService: AiService,
    private subscriptionsService: SubscriptionsService,
  ) { }

  private readonly VIOLATION_LIMIT = 3;
  private readonly logger = new Logger(JobPostingsService.name);

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
      branchIds,
      isAiGenerated,
      ...rest
    } = createJobPostingDto as any;

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
    const textToAnalyze = `${createJobPostingDto.title} ${hardSkills?.join(' ') || ''}`.toLowerCase();
    const categories = new Set<string>();
    const combinedKeywords = {
      ...HIERARCHICAL_INDUSTRIES.reduce((acc, cat) => {
        acc[cat.category] = cat.keywords;
        return acc;
      }, {} as Record<string, string[]>),
      'Backend': ['backend', 'back-end', 'java', 'node', 'python', 'php', 'c#', '.net', 'golang', 'ruby'],
      'Frontend': ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css'],
      'Fullstack': ['fullstack', 'full-stack', 'mern', 'mean'],
      'Mobile': ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
      'DevOps/Cloud': ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'azure', 'gcp', 'ci/cd', 'jenkins'],
      'AI/Machine Learning': ['ai ', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'ai engineer'],
      'Data': ['data engineer', 'data analyst', 'data scientist', 'sql', 'spark', 'hadoop'],
      'QA/Tester': ['qa', 'tester', 'automation test', 'manual test', 'selenium', 'cypress'],
      'System/Network': ['system admin', 'network', 'linux', 'sysadmin', 'it helpdesk'],
      'UI/UX Design': ['ui/ux', 'designer', 'figma', 'design', 'graphic'],
    };
    for (const [cat, kws] of Object.entries(combinedKeywords)) {
      if (kws.some(kw => textToAnalyze.includes(kw))) {
        categories.add(cat);
      }
    }
    if (categories.size === 0) categories.add('Đa lĩnh vực / Khác');

    const job = await this.prisma.jobPosting.create({
      data: {
        ...rest,
        salaryMin: salaryMin || null,
        salaryMax: salaryMax || null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        postType: 'MANUAL',
        status: finalStatus,
        jobTier: requestedJobTier,
        isVerified: finalStatus === 'APPROVED',
        aiReliabilityScore,
        originalUrl: originalUrl,
        slug: generatedSlug,
        structuredRequirements: {
          hardSkills: hardSkills || [],
          softSkills: softSkills || [],
          minExperienceYears: minExperienceYears || 0,
          vacancies: createJobPostingDto.vacancies || 1,
          aiFeedback: modResult?.feedback || null,
          aiFlags: modResult?.flags || [],
          aiReason: modResult?.reason || null,
          isAiGenerated: isAiGenerated === true,
          categories: Array.from(categories),
        },
        branches: {
          connect:
            createJobPostingDto.branchIds?.map((id) => ({ branchId: id })) ||
            [],
        },
      },
      include: {
        company: true,
        recruiter: { include: { user: { select: { email: true } } } },
      },
    });

    // Nếu bị từ chối tự động do blacklist -> Cộng 1 lượt vi phạm
    if (finalStatus === JobStatus.REJECTED && containsBadWords) {
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
        branches: true,
      },
    });

    // Sort items to match ES order (relevance or custom sort)
    let sortedItems = ids
      .map((id) => items.find((item) => item.jobPostingId === id))
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
    let industryKeywords: string[] = [];

    if (industry) {
      // 1. Try to find if it's a main category
      const targetCat = HIERARCHICAL_INDUSTRIES.find(c => c.category === industry);
      if (targetCat) {
        industryKeywords = targetCat.keywords;
      }

      // 2. If nothing found, it's likely a sub-category name
      if (industryKeywords.length === 0) {
        industryKeywords = [industry];
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
    if (industryKeywords.length > 0) {
      const industryConds = industryKeywords.flatMap((kw) => [
        { title: { contains: kw, mode: 'insensitive' } },
        { description: { contains: kw, mode: 'insensitive' } },
        { requirements: { contains: kw, mode: 'insensitive' } },
      ]);
      andClauses.push({ OR: industryConds });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    let [items, total] = (await Promise.all([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        include: {
          company: true,
          recruiter: true,
          branches: true,
        },
        orderBy: [{ jobTier: 'desc' }, { refreshedAt: 'desc' }],
      }),
      this.prisma.jobPosting.count({ where }),
    ])) as [any[], number];

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
        branches: true,
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
        branches: true,
        applications: { select: { applicationId: true } },
      },
    });

    if (!job)
      throw new NotFoundException(`Không tìm thấy Job với ID/Slug ${id}`);

    let isRecipientCandidate = true;
    if (userId) {
      if (job.recruiter?.userId === userId) {
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
          where: { jobPostingId: job.jobPostingId },
          data: { viewCount: { increment: 1 } },
          select: { jobPostingId: true }, // Minimal return
        })
        .then(() => {
          if (job.recruiter?.userId) {
            this.messagesGateway.server
              .to(`user_${job.recruiter.userId}`)
              .emit('jdViewUpdated', { jobPostingId: job.jobPostingId });
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

    return { ...job, hasApplied, isSaved, matchScore };
  }

  getIndustries() {
    return HIERARCHICAL_INDUSTRIES;
  }

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    // Kiểm tra tồn tại trước khi update (dùng findUnique để không trigger trackView)
    const existingJob = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
    });
    if (!existingJob)
      throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);

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
    const categoriesSet = new Set<string>();
    const textToAnalyze = `${updateJobPostingDto.title || existingJob.title || ''} ${(hardSkills || currentStructured.hardSkills || []).join(' ')}`.toLowerCase();
    const combinedKeywordsUpdate = {
      ...HIERARCHICAL_INDUSTRIES.reduce((acc, cat) => {
        acc[cat.category] = cat.keywords;
        return acc;
      }, {} as Record<string, string[]>),
      'Backend': ['backend', 'back-end', 'java', 'node', 'python', 'php', 'c#', '.net', 'golang', 'ruby'],
      'Frontend': ['frontend', 'front-end', 'react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css'],
      'Fullstack': ['fullstack', 'full-stack', 'mern', 'mean'],
      'Mobile': ['mobile', 'ios', 'android', 'flutter', 'react native', 'swift', 'kotlin'],
      'DevOps/Cloud': ['devops', 'cloud', 'aws', 'docker', 'kubernetes', 'azure', 'gcp', 'ci/cd', 'jenkins'],
      'AI/Machine Learning': ['ai ', 'machine learning', 'deep learning', 'nlp', 'computer vision', 'ai engineer'],
      'Data': ['data engineer', 'data analyst', 'data scientist', 'sql', 'spark', 'hadoop'],
      'QA/Tester': ['qa', 'tester', 'automation test', 'manual test', 'selenium', 'cypress'],
      'System/Network': ['system admin', 'network', 'linux', 'sysadmin', 'it helpdesk'],
      'UI/UX Design': ['ui/ux', 'designer', 'figma', 'design', 'graphic'],
    };
    for (const [cat, kws] of Object.entries(combinedKeywordsUpdate)) {
      if (kws.some(kw => textToAnalyze.includes(kw))) {
        categoriesSet.add(cat);
      }
    }
    if (categoriesSet.size === 0 && !isStatusOnlyUpdate) categoriesSet.add('Đa lĩnh vực / Khác');

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
          ...(!isStatusOnlyUpdate && { categories: Array.from(categoriesSet) }),
          ...(modResult && {
            aiFeedback: modResult.feedback,
            aiFlags: modResult.flags,
            aiReason: modResult.reason
          }),
        },
        ...(aiReliabilityScore !== undefined && { aiReliabilityScore }),
        ...(newStatus === JobStatus.APPROVED && { isVerified: true }),
        ...(branchIds && {
          branches: { set: branchIds.map((id: string) => ({ branchId: id })) },
        }),
        updatedAt: new Date(),
      },
      include: { company: true, recruiter: true },
    });

    // Nếu cập nhật dẫn đến vi phạm -> Cộng 1 lượt vi phạm
    if (
      newStatus === JobStatus.REJECTED &&
      containsBadWords &&
      result.recruiterId
    ) {
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
    const [totalPending, totalApproved, totalRejected, totalCrawled] =
      await Promise.all([
        this.prisma.jobPosting.count({ where: { status: 'PENDING' } }),
        this.prisma.jobPosting.count({ where: { status: 'APPROVED' } }),
        this.prisma.jobPosting.count({ where: { status: 'REJECTED' } }),
        this.prisma.jobPosting.count({ where: { postType: 'CRAWLED' } }),
      ]);
    return { totalPending, totalApproved, totalRejected, totalCrawled };
  }

  async findAllAdmin(query: AdminFilterJobPostingDto) {
    const {
      status,
      postType,
      minAiScore,
      searchTerm,
      page = 1,
      limit = 10,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (postType) where.postType = postType;
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
  async updateStatus(id: string, status: JobStatus, adminId: string) {
    const job = await this.findOne(id);

    let updated = await this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        status,
        approvedBy: adminId,
        updatedAt: new Date(),
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

    const matches = await this.matchingService.runMatchingForJob(jobId);

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
    return this.matchingService.runMatchingForCandidate(userId);
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
        const keywords = cat.keywords || [];
        if (keywords.length === 0) return;
        
        const count = await this.prisma.jobPosting.count({
          where: {
            status: 'APPROVED' as JobStatus,
            OR: keywords.flatMap((kw) => [
              { title: { contains: kw, mode: 'insensitive' } },
              { description: { contains: kw, mode: 'insensitive' } },
              { requirements: { contains: kw, mode: 'insensitive' } },
            ]),
          },
        });
        stats[cat.category] = count;
      }),
    );

    return stats;
  }
}
