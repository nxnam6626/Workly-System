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
import { JobStatus } from '@prisma/client';
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

// Industry keyword map for content-based filtering (since DB has no `industry` field)
const INDUSTRY_TAG_MAP: Record<string, string[]> = {
  'CNTT / Phần mềm': ['frontend', 'backend', 'developer', 'dev ', 'lập trình', 'software', 'react', 'nodejs', 'java', 'python', 'devops', 'data', 'mobile', 'flutter', 'fullstack', 'qa', 'tester', 'scrum', 'công nghệ thông tin', 'typescript', 'golang', 'php', 'ruby', 'swift', 'kotlin', 'angular', 'vue', '.net', 'c++', 'blockchain', 'ai engineer', 'ml engineer'],
  'Marketing / Truyền thông': ['marketing', 'digital marketing', 'brand', 'tiếp thị', 'thị trường', 'google ads', 'facebook ads', 'campaign', 'crm'],
  'Content / SEO': ['content', 'copywriter', 'seo', 'sem', 'social media', 'blog', 'editor'],
  'Tài chính / Kế toán / Ngân hàng': ['kế toán', 'accounting', 'finance', 'tài chính', 'audit', 'kiểm toán', 'ngân hàng', 'banking', 'tax', 'thuế', 'chứng khoán', 'cfo', 'tín dụng', 'giao dịch viên'],
  'Nhân sự / Hành / Pháp lý': ['nhân sự', 'tuyển dụng', 'recruiter', 'hành chính', 'legal', 'pháp lý', 'compliance', 'hr', 'c&b', 'chuyên viên nhân sự', 'luật'],
  'Kinh doanh / CSKH': ['sales', 'kinh doanh', 'telesale', 'business development', 'bán hàng', 'b2b', 'b2c', 'key account', 'chăm sóc khách hàng', 'cskh', 'customer service', 'tư vấn viên', 'telemarketing'],
  'Thiết kế / Sáng tạo': ['graphic', 'thiết kế', 'figma', 'adobe', 'animation', 'ui/ux', 'creative director', 'đồ họa', 'illustrator', 'video editor', 'dựng phim', 'designer'],
  'Kỹ thuật / Cơ khí / Sản xuất': ['cơ khí', 'electrical', 'điện tử', 'automation', 'qc', 'sản xuất', 'manufacturing', 'cnc', 'plc', 'bảo trì', 'điện lạnh', 'kỹ sư', 'vận hành'],
  'Xây dựng / Kiến trúc': ['xây dựng', 'kiến trúc', 'civil engineering', 'mep', 'construction', 'bim', 'autocad', 'thi công', 'giám sát', 'bản vẽ'],
  'Vận tải / Logistics / Cung ứng': ['logistics', 'supply chain', 'xuất nhập khẩu', 'warehouse', 'forwarder', 'procurement', 'vận tải', 'giao nhận', 'lái xe', 'tài xế', 'kho bãi'],
  'Bán lẻ / LFP / Thời trang': ['retail', 'bán lẻ', 'store manager', 'fmcg', 'consumer', 'bán hàng', 'thu ngân', 'cửa hàng', 'thời trang', 'mỹ phẩm', 'trang sức', 'giày da'],
  'Nhà hàng / Khách sạn / Du lịch': ['hotel', 'khách sạn', 'du lịch', 'f&b', 'nhà hàng', 'hospitality', 'chef', 'bếp', 'pha chế', 'barista', 'phục vụ', 'bồi bàn', 'lễ tân', 'tour guide', 'hướng dẫn viên'],
  'Y tế / Dược phẩm / Sức khỏe': ['y tế', 'dược', 'pharma', 'medical', 'nurse', 'điều dưỡng', 'clinic', 'chăm sóc sức khỏe', 'bác sĩ', 'phòng khám', 'trình dược viên'],
  'Giáo dục / Đào tạo / Ngôn ngữ': ['giáo viên', 'teacher', 'gia sư', 'tutor', 'e-learning', 'training', 'biên dịch', 'giáo dục', 'đào tạo', 'giảng viên', 'trợ giảng', 'tiếng anh'],
  'Nông nghiệp / Môi trường': ['nông nghiệp', 'agriculture', 'môi trường', 'thủy sản', 'lâm nghiệp', 'chăn nuôi', 'thú y'],
  'Bất động sản': ['bất động sản', 'real estate', 'property', 'môi giới bất động sản', 'địa ốc', 'căn hộ'],
  'Truyền thông / Sự kiện': ['báo chí', 'journalist', 'public relations', 'media', 'broadcast', 'sự kiện', 'event', 'phóng viên', 'truyền hình'],
  'Thể thao / Làm đẹp / Giải trí': ['gym', 'fitness', 'spa', 'nail', 'làm đẹp', 'game', 'entertainment', 'thẩm mỹ'],
  'Bảo hiểm / Tư vấn': ['bảo hiểm', 'insurance', 'tư vấn bảo hiểm'],
  'Đa lĩnh vực / Khác': ['ngo', 'phi chính phủ', 'giúp việc', 'bảo vệ', 'tạp vụ', 'trợ lý', 'thư ký', 'part time', 'bán thời gian']
};

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
  ) {}

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
        finalStatus = JobStatus.PENDING; // Cần admin duyệt thủ công
        this.logger.warn(
          `[JobPostings] JD "${createJobPostingDto.title}" flagged by AI: ${modResult.reason} | flags: ${modResult.flags.join(', ')}`,
        );
      } else {
        finalStatus = JobStatus.APPROVED; // AI xác nhận an toàn → tự động duyệt
        this.logger.log(
          `[JobPostings] JD "${createJobPostingDto.title}" auto-approved (score=${aiReliabilityScore}, usedAI=${modResult.usedAI})`,
        );
      }
    }

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
      return { items: [], total: 0, page, limit };
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
    // Industry filter: keyword-based matching via INDUSTRY_TAG_MAP
    const { industry } = query;
    const industryKeywords = industry
      ? INDUSTRY_TAG_MAP[industry] || [industry]
      : [];

    // Build all filter clauses — use AND to combine safely
    const andClauses: any[] = [];

    // Location filter
    const locationCond = this.buildLocationCondition(location);
    if (locationCond) andClauses.push(locationCond);

    if (jobType) where.jobType = jobType;
    if (jobTier) where.jobTier = jobTier;

    // Search filter
    if (search) {
      andClauses.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          {
            company: { companyName: { contains: search, mode: 'insensitive' } },
          },
        ],
      });
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
        if (job.status !== 'REJECTED') {
          const matches = await this.matchingService.runMatchingForJob(
            job.jobPostingId,
          );
          matchedCount = matches.length;
        }
        return {
          ...job,
          matchedCount,
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

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    // Kiểm tra tồn tại trước khi update (dùng findUnique để không trigger trackView)
    const existingJob = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
    });
    if (!existingJob)
      throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);

    const { branchIds, hardSkills, softSkills, minExperienceYears, ...rest } =
      updateJobPostingDto;

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

    if (!isStatusOnlyUpdate) {
      if (containsBadWords) {
        newStatus = JobStatus.REJECTED;
      } else {
        newStatus = JobStatus.PENDING;
      }
    }

    const currentStructured = (existingJob.structuredRequirements as any) || {};

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
        },
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

    // Đạt ngưỡng → khóa tài khoản
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
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: jobId },
      select: { status: true },
    });

    if (job?.status === 'REJECTED') {
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
          include: { user: { select: { avatar: true } } },
        });
        return {
          ...m,
          fullName: isUnlocked
            ? candidate?.fullName || 'Ứng viên'
            : `Ứng viên #${m.candidateId.slice(0, 4)}`,
          major: candidate?.major || '',
          user: { avatar: isUnlocked ? candidate?.user?.avatar : null },
          isUnlocked,
        };
      }),
    );

    // Return top 5 matches
    return enriched.sort((a, b) => b.score - a.score).slice(0, 5);
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
}
