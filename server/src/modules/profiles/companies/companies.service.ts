import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { SupabaseService } from '@/common/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import * as xlsx from 'xlsx';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';
import { HIERARCHICAL_INDUSTRIES } from '@/modules/core-jobs/jobs/job-postings/constants/industries';

const COMPLETENESS_WEIGHTS: Record<string, number> = {
  companyName: 5,
  taxCode: 10,
  logo: 10,
  banner: 10,
  address: 5,
  description: 10,
  websiteUrl: 5,
  companySize: 5,
  mainIndustry: 10,
  workLocations: 10,
  sections: 10,
  benefits: 5,
  history: 5,
};

const ESGOO_API_URL = 'https://esgoo.net/api-mst';
const NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org/search';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
  ) {}

  async findAll(query: FilterCompanyDto) {
    const { search, page = 1, limit = 10, sortBy = 'ALPHABETICAL', industry } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    const andClauses: any[] = [];

    if (search) {
      andClauses.push({ companyName: { contains: search, mode: 'insensitive' } });
    }
    if (industry) {
      const targetCat = HIERARCHICAL_INDUSTRIES.find(
        (c) => c.category === industry,
      );
      
      if (targetCat) {
        const industriesToMatch = [targetCat.category, ...targetCat.subCategories];
        andClauses.push({
          OR: industriesToMatch.map((ind) => ({
            mainIndustry: { contains: ind, mode: 'insensitive' },
          })),
        });
      } else {
        andClauses.push({ mainIndustry: { contains: industry, mode: 'insensitive' } });
      }
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    let orderBy: any = { companyName: 'asc' };

    if (sortBy === 'TRENDING') {
      orderBy = { jobPostings: { _count: 'desc' } };
    } else if (sortBy === 'TYPICAL') {
      orderBy = { companySize: 'desc' };
    }

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: {
            select: {
              jobPostings: { where: { status: 'APPROVED' } },
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items: items.map((c) => ({ ...c, activeJobs: c._count.jobPostings })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId: id },
      include: {
        jobPostings: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        branches: true,
        sections: { orderBy: { displayOrder: 'asc' } },
        benefits: true,
        history: { orderBy: { year: 'desc' } },
      } as any,
    });

    if (!company) {
      throw new NotFoundException(`Không tìm thấy công ty với ID ${id}`);
    }

    const jobCount = await this.prisma.jobPosting.count({
      where: { companyId: company.companyId, status: 'APPROVED' },
    });

    const stats = await this.getCompanyReviewStats(company.companyId);

    return {
      ...company,
      completeness: this.calculateCompleteness(company),
      jobPostingsCount: jobCount,
      ...stats,
    };
  }

  async getMyCompany(userId: string) {
    const recruiter: any = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: {
        company: {
          include: {
            jobPostings: {
              where: { status: 'APPROVED' },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
            branches: true,
            sections: { orderBy: { displayOrder: 'asc' } },
            benefits: true,
            history: { orderBy: { year: 'desc' } },
          } as any,
        },
      },
    });

    if (!recruiter?.company) return {};

    const jobCount = await this.prisma.jobPosting.count({
      where: { companyId: recruiter.company.companyId, status: 'APPROVED' },
    });

    const stats = await this.getCompanyReviewStats(recruiter.company.companyId);

    return {
      ...recruiter.company,
      completeness: this.calculateCompleteness(recruiter.company),
      jobPostingsCount: jobCount,
      ...stats,
    };
  }

  async updateMyCompany(userId: string, updateData: any) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Nhà tuyển dụng không tồn tại');

    if (
      updateData.companyName !== undefined &&
      (!updateData.companyName || updateData.companyName.trim() === '')
    ) {
      throw new BadRequestException('Tên công ty không được để trống');
    }
    if (
      updateData.address !== undefined &&
      (!updateData.address || updateData.address.trim() === '')
    ) {
      throw new BadRequestException('Địa chỉ công ty không được để trống');
    }

    if (!recruiter.companyId) {
      if (!updateData.companyName || !updateData.address) {
        throw new BadRequestException(
          'Vui lòng cung cấp đầy đủ tên và địa chỉ công ty để khởi tạo',
        );
      }
      return this.createNewCompany(recruiter.recruiterId, updateData);
    }

    return this.updateExistingCompany(recruiter.companyId, updateData);
  }

  private async createNewCompany(recruiterId: string, data: any) {
    const { sections, benefits, history, ...basicData } = data;

    const createPayload: any = {
      ...basicData,
      sections:
        sections?.length > 0
          ? {
              create: sections.map((s) => ({
                title: s.title,
                content: s.content,
                type: s.type,
                displayOrder: s.displayOrder,
              })),
            }
          : undefined,
      benefits:
        benefits?.length > 0
          ? {
              create: benefits.map((b) => ({
                title: b.title,
                icon: b.icon,
              })),
            }
          : undefined,
      history:
        history?.length > 0
          ? {
              create: history.map((h) => ({
                year: h.year,
                event: h.event,
              })),
            }
          : undefined,
    };

    const company = await this.prisma.company.create({ data: createPayload });
    await this.prisma.recruiter.update({
      where: { recruiterId },
      data: { companyId: company.companyId },
    });
    return company;
  }

  private async updateExistingCompany(companyId: string, data: any) {
    const { sections, benefits, history, ...basicData } = data;

    const updatePayload: any = { ...basicData };

    if (sections) {
      updatePayload.sections = {
        deleteMany: {},
        create: sections.map((s) => ({
          title: s.title,
          content: s.content,
          type: s.type,
          displayOrder: s.displayOrder,
        })),
      };
    }

    if (benefits) {
      updatePayload.benefits = {
        deleteMany: {},
        create: benefits.map((b) => ({
          title: b.title,
          icon: b.icon,
        })),
      };
    }

    if (history) {
      updatePayload.history = {
        deleteMany: {},
        create: history.map((h) => ({
          year: h.year,
          event: h.event,
        })),
      };
    }

    const company = await this.prisma.company.update({
      where: { companyId },
      data: updatePayload,
      include: { branches: true },
    });

    if (data.address && company.branches.length === 0) {
      await this.createDefaultBranch(companyId, data.address);
    }

    return company;
  }

  private async createDefaultBranch(companyId: string, address: string) {
    return this.prisma.companyBranch.create({
      data: {
        name: 'Trụ sở chính',
        address,
        companyId,
        isVerified: true,
      },
    });
  }

  async uploadLogo(userId: string, file: Express.Multer.File) {
    return this.uploadCompanyAsset(userId, file, 'logo', 'logos');
  }

  async uploadBanner(userId: string, file: Express.Multer.File) {
    return this.uploadCompanyAsset(userId, file, 'banner', 'banners');
  }

  private async uploadCompanyAsset(
    userId: string,
    file: Express.Multer.File,
    field: 'logo' | 'banner',
    folder: string,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId)
      throw new NotFoundException('Chưa có thông tin công ty.');

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${field}-${recruiter.companyId}-${Date.now()}.${fileExt}`;
    const path = `companies/${folder}/${fileName}`;

    const url = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    await this.prisma.company.update({
      where: { companyId: recruiter.companyId },
      data: { [field]: url },
    });

    return { url };
  }

  async addBranch(
    userId: string,
    data: {
      name: string;
      address: string;
      latitude?: number;
      longitude?: number;
    },
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId)
      throw new NotFoundException('Không tìm thấy thông tin công ty');

    let { latitude, longitude } = data;
    let isVerified = !!(latitude && longitude);

    if (!isVerified) {
      const geo = await this.geocodeAddress(data.address);
      if (geo) {
        latitude = geo.lat;
        longitude = geo.lon;
        isVerified = true;
      }
    }

    return this.prisma.companyBranch.create({
      data: {
        ...data,
        latitude,
        longitude,
        isVerified,
        companyId: recruiter.companyId,
      },
    });
  }

  private async geocodeAddress(
    address: string,
  ): Promise<{ lat: number; lon: number } | null> {
    const fetchCoords = async (query: string) => {
      try {
        const res = await fetch(
          `${NOMINATIM_API_URL}?q=${encodeURIComponent(query)}&format=json&limit=1`,
          {
            headers: { 'User-Agent': 'Workly-System' },
          },
        );
        if (!res.ok) return null;
        const json = await res.json();
        return json?.[0]
          ? { lat: parseFloat(json[0].lat), lon: parseFloat(json[0].lon) }
          : null;
      } catch {
        return null;
      }
    };

    // Try full address
    const coords = await fetchCoords(address);
    if (coords) return coords;

    // Fallback: Try simplified address (last 3 segments)
    const parts = address.split(',');
    if (parts.length > 2) {
      const simplified = parts.slice(-3).join(',').trim();
      return fetchCoords(simplified);
    }

    return null;
  }

  async deleteBranch(userId: string, branchId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId) throw new NotFoundException();

    return this.prisma.companyBranch.deleteMany({
      where: { branchId, companyId: recruiter.companyId },
    });
  }

  // --- Rich Profile Methods ---

  async saveSection(userId: string, data: any) {
    const companyId = await this.getCompanyId(userId);

    if (data.id) {
      return (this.prisma as any).companySection.update({
        where: { id: data.id, companyId },
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          displayOrder: data.displayOrder,
        },
      });
    }

    return (this.prisma as any).companySection.create({
      data: { ...data, companyId },
    });
  }

  async deleteSection(userId: string, id: string) {
    const companyId = await this.getCompanyId(userId);
    return (this.prisma as any).companySection.delete({
      where: { id, companyId },
    });
  }

  async saveBenefit(userId: string, data: any) {
    const companyId = await this.getCompanyId(userId);

    if (data.id) {
      return (this.prisma as any).companyBenefit.update({
        where: { id: data.id, companyId },
        data: { title: data.title, icon: data.icon },
      });
    }

    return (this.prisma as any).companyBenefit.create({
      data: { ...data, companyId },
    });
  }

  async deleteBenefit(userId: string, id: string) {
    const companyId = await this.getCompanyId(userId);
    return (this.prisma as any).companyBenefit.delete({
      where: { id, companyId },
    });
  }

  async saveHistory(userId: string, data: any) {
    const companyId = await this.getCompanyId(userId);

    if (data.id) {
      return (this.prisma as any).companyHistory.update({
        where: { id: data.id, companyId },
        data: { year: data.year, event: data.event },
      });
    }

    return (this.prisma as any).companyHistory.create({
      data: { ...data, companyId },
    });
  }

  async deleteHistory(userId: string, id: string) {
    const companyId = await this.getCompanyId(userId);
    return (this.prisma as any).companyHistory.delete({
      where: { id, companyId },
    });
  }

  private async getCompanyId(userId: string): Promise<string> {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId)
      throw new NotFoundException('Công ty không tồn tại');
    return recruiter.companyId;
  }

  // --- Member Management Methods ---

  async getRecruiterInfo(userId: string) {
    return this.prisma.recruiter.findUnique({ where: { userId } });
  }

  async getMembers(userId: string) {
    const companyId = await this.getCompanyId(userId);
    return this.prisma.recruiter.findMany({
      where: { companyId },
      include: {
        user: { select: { email: true, status: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async notifyCompanyMembers(
    companyId: string,
    eventName: string,
    data?: any,
  ) {
    const members = await this.prisma.recruiter.findMany({
      where: { companyId },
    });
    for (const member of members) {
      if (this.messagesGateway?.server) {
        // Emit for UI update (e.g. refresh list)
        this.messagesGateway.server
          .to(`user_${member.userId}`)
          .emit(eventName, data);

        // Create persistent notification and emit for bell icon
        if (data?.message) {
          const notification = await this.notificationsService.create(
            member.userId,
            'Quản lý nhân sự',
            data.message,
            'info',
            '/recruiter/company?tab=members',
          );
          this.messagesGateway.server
            .to(`user_${member.userId}`)
            .emit('notification', notification);
        }
      }
    }
  }

  async addMember(userId: string, data: { fullName: string; email: string }) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId)
      throw new NotFoundException('Công ty không tồn tại');
    if (recruiter.companyRole !== 'MASTER')
      throw new BadRequestException('Chỉ MASTER mới được tạo thành viên');

    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser)
      throw new BadRequestException('Email đã tồn tại trong hệ thống');

    const hashedPassword = await bcrypt.hash('123456', 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          status: 'ACTIVE',
        },
      });

      const roleRecord = await tx.role.upsert({
        where: { roleName: 'RECRUITER' },
        update: {},
        create: { roleName: 'RECRUITER' },
      });

      await tx.userRole.create({
        data: { userId: newUser.userId, roleId: roleRecord.roleId },
      });

      return tx.recruiter.create({
        data: {
          userId: newUser.userId,
          fullName: data.fullName,
          companyId: recruiter.companyId,
          companyRole: 'MEMBER',
        },
      });
    });

    // Notify after transaction
    await this.notifyCompanyMembers(
      recruiter.companyId,
      'companyMembersUpdated',
      {
        type: 'ADD',
        message: `Thành viên mới ${data.fullName} vừa được thêm vào công ty.`,
      },
    );

    return result;
  }

  async addMembersBulk(userId: string, file: Express.Multer.File) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter?.companyId)
      throw new NotFoundException('Công ty không tồn tại');
    if (recruiter.companyRole !== 'MASTER')
      throw new BadRequestException('Chỉ MASTER mới được tạo thành viên');

    let lines: any[] = [];
    try {
      const workbook = xlsx.read(file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      lines = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    } catch (e) {
      throw new BadRequestException(
        'Không thể đọc file. Vui lòng tải lên file Excel (.xlsx, .xls) hoặc CSV hợp lệ.',
      );
    }

    const hasEmailColumn = lines.some(
      (row) =>
        Array.isArray(row) && row.some((cell) => String(cell).includes('@')),
    );
    if (!hasEmailColumn) {
      throw new BadRequestException(
        'File không đúng định dạng. File cần chứa thông tin Email của nhân sự.',
      );
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };
    const hashedPassword = await bcrypt.hash('123456', 10);

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i];
      if (Array.isArray(parts) && parts.length >= 1) {
        let fullName = '';
        let email = '';

        for (const cell of parts) {
          const str = String(cell).trim();
          if (str.includes('@')) {
            email = str;
          } else if (!fullName && str.length > 0) {
            fullName = str;
          }
        }

        if (!email) continue;
        if (!fullName) fullName = email.split('@')[0];

        try {
          const existingUser = await this.prisma.user.findUnique({
            where: { email },
          });
          if (existingUser) {
            results.failed++;
            results.errors.push(`Email ${email} đã tồn tại`);
            continue;
          }

          await this.prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
              data: { email, password: hashedPassword, status: 'ACTIVE' },
            });
            const roleRecord = await tx.role.upsert({
              where: { roleName: 'RECRUITER' },
              update: {},
              create: { roleName: 'RECRUITER' },
            });
            await tx.userRole.create({
              data: { userId: newUser.userId, roleId: roleRecord.roleId },
            });
            await tx.recruiter.create({
              data: {
                userId: newUser.userId,
                fullName,
                companyId: recruiter.companyId,
                companyRole: 'MEMBER',
              },
            });
          });
          results.success++;
        } catch (e) {
          results.failed++;
          results.errors.push(`Lỗi tạo user ${email}`);
        }
      }
    }

    if (results.success > 0) {
      await this.notifyCompanyMembers(
        recruiter.companyId,
        'companyMembersUpdated',
        {
          type: 'BULK_ADD',
          message: `Đã thêm ${results.success} thành viên vào công ty.`,
        },
      );
    }

    return results;
  }

  async blockMember(
    userId: string,
    targetRecruiterId: string,
    isBlocked: boolean,
  ) {
    const master = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!master?.companyId || master.companyRole !== 'MASTER') {
      throw new BadRequestException('Không có quyền thao tác');
    }

    const target = await this.prisma.recruiter.findUnique({
      where: { recruiterId: targetRecruiterId },
    });
    if (
      !target ||
      target.companyId !== master.companyId ||
      target.companyRole === 'MASTER'
    ) {
      throw new BadRequestException('Không thể khóa tài khoản này');
    }

    await this.prisma.user.update({
      where: { userId: target.userId },
      data: { status: isBlocked ? 'LOCKED' : 'ACTIVE' },
    });

    // Realtime notification for the bell icon
    this.notificationsService.emitToUser(target.userId, 'notification', {
      title: 'Quản lý nhân sự',
      message: `Tài khoản ${target.fullName} ${isBlocked ? 'đã bị khóa' : 'đã được mở khóa'}.`,
      type: isBlocked ? 'error' : 'success',
    });

    // Force logout if blocked
    if (isBlocked) {
      this.notificationsService.emitToUser(target.userId, 'accountLocked', {
        message:
          'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.',
      });
    }

    await this.notifyCompanyMembers(master.companyId, 'companyMembersUpdated', {
      type: isBlocked ? 'BLOCK' : 'UNBLOCK',
      message: `Tài khoản ${target.fullName} ${isBlocked ? 'đã bị khóa' : 'đã được mở khóa'}.`,
      targetUserId: target.userId,
    });

    return { success: true };
  }

  // --- End Member Management Methods ---

  async getTopEmployers(limit = 10) {
    const companies = await this.prisma.company.findMany({
      take: limit,
      include: {
        _count: {
          select: { jobPostings: { where: { status: 'APPROVED' } } },
        },
      },
      orderBy: { jobPostings: { _count: 'desc' } },
    });

    return companies
      .filter((c) => c._count.jobPostings > 0)
      .map((c) => ({
        companyId: c.companyId,
        companyName: c.companyName,
        logo: c.logo,
        slug: c.slug,
        jobsCount: c._count.jobPostings,
        mainIndustry: c.mainIndustry,
        isRegistered: c.isRegistered,
      }));
  }

  async findOrCreateCompanyFromTaxCode(
    tx: any,
    data: {
      companyName: string;
      taxCode?: string;
      websiteUrl?: string;
      verifyStatus?: number;
    },
  ) {
    if (!data.companyName) return null;

    if (data.taxCode) {
      const existing = await tx.company.findFirst({
        where: { taxCode: data.taxCode },
      });
      if (existing) return existing.companyId;
    }

    let apiData: any = null;
    if (data.taxCode) {
      try {
        const res = await fetch(`${ESGOO_API_URL}/${data.taxCode}.htm`);
        const json = await res.json();
        if (json.error === 0) apiData = json.data;
      } catch (e) {
        console.error('Failed to fetch tax code data', e);
      }
    }

    const company = await tx.company.create({
      data: {
        companyName: apiData?.ten || data.companyName,
        taxCode: data.taxCode || null,
        address: apiData?.dc || null,
        websiteUrl: data.websiteUrl || null,
        taxAddress: apiData?.dc || null,
        status: apiData?.tinhtrang || null,
        internationalName: apiData?.internationalName || null,
        shortName: apiData?.shortName || null,
        verifyStatus: apiData || data.verifyStatus ? 1 : 0,
        branches: {
          create: {
            name: 'Trụ sở chính',
            address: apiData?.dc || 'Đang cập nhật',
            isVerified: !!apiData,
          },
        },
      },
    });

    return company.companyId;
  }

  private calculateCompleteness(company: any) {
    const breakdown = {
      companyName: !!company.companyName,
      taxCode: !!company.taxCode,
      logo: !!company.logo,
      banner: !!company.banner,
      address: !!company.address,
      description: !!company.description && company.description.length > 50,
      websiteUrl: !!company.websiteUrl,
      companySize: !!company.companySize,
      mainIndustry: !!company.mainIndustry,
      workLocations:
        (Array.isArray(company.branches) && company.branches.length > 0) ||
        !!company.address,
      sections: Array.isArray(company.sections) && company.sections.length > 0,
      benefits: Array.isArray(company.benefits) && company.benefits.length > 0,
      history: Array.isArray(company.history) && company.history.length > 0,
    };

    let total = 0;
    Object.keys(COMPLETENESS_WEIGHTS).forEach((key) => {
      if (breakdown[key as keyof typeof breakdown]) {
        total += COMPLETENESS_WEIGHTS[key];
      }
    });

    return { total, breakdown };
  }

  private async getCompanyReviewStats(companyId: string) {
    const reviews = await this.prisma.companyReview.findMany({
      where: { companyId, status: 'PUBLISHED' },
      select: { ratingProcess: true, ratingInterviewer: true, ratingOffice: true },
    });

    if (reviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }

    const count = reviews.length;
    const avgProcess = reviews.reduce((s, r) => s + r.ratingProcess, 0) / count;
    const avgInterviewer = reviews.reduce((s, r) => s + r.ratingInterviewer, 0) / count;
    const avgOffice = reviews.reduce((s, r) => s + r.ratingOffice, 0) / count;
    const avgTotal = (avgProcess + avgInterviewer + avgOffice) / 3;

    return {
      averageRating: Math.round(avgTotal * 10) / 10,
      reviewCount: count,
    };
  }
}
