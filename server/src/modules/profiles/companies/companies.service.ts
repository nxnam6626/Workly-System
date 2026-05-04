import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { SupabaseService } from '@/common/supabase/supabase.service';

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
  ) {}

  async findAll(query: FilterCompanyDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? { companyName: { contains: search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { companyName: 'asc' },
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
        jobPostings: { where: { status: 'APPROVED' } },
        branches: true,
        sections: { orderBy: { displayOrder: 'asc' } },
        benefits: true,
        history: { orderBy: { year: 'desc' } },
      } as any,
    });

    if (!company) {
      throw new NotFoundException(`Không tìm thấy công ty với ID ${id}`);
    }

    return {
      ...company,
      completeness: this.calculateCompleteness(company),
    };
  }

  async getMyCompany(userId: string) {
    const recruiter: any = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: {
        company: {
          include: {
            branches: true,
            sections: { orderBy: { displayOrder: 'asc' } },
            benefits: true,
            history: { orderBy: { year: 'desc' } },
          } as any,
        },
      },
    });

    if (!recruiter?.company) return {};

    return {
      ...recruiter.company,
      completeness: this.calculateCompleteness(recruiter.company),
    };
  }

  async updateMyCompany(userId: string, updateData: any) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Nhà tuyển dụng không tồn tại');

    if (!recruiter.companyId) {
      return this.createNewCompany(recruiter.recruiterId, updateData);
    }

    return this.updateExistingCompany(recruiter.companyId, updateData);
  }

  private async createNewCompany(recruiterId: string, data: any) {
    const company = await this.prisma.company.create({ data });
    await this.prisma.recruiter.update({
      where: { recruiterId },
      data: { companyId: company.companyId },
    });
    return company;
  }

  private async updateExistingCompany(companyId: string, data: any) {
    const company = await this.prisma.company.update({
      where: { companyId },
      data,
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

  // --- End Rich Profile Methods ---

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
}
