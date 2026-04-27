import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
  ) { }

  async findAll(query: FilterCompanyDto) {
    const { search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.companyName = { contains: search, mode: 'insensitive' };
    }

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

    const formattedItems = items.map((c) => ({
      ...c,
      activeJobs: c._count.jobPostings,
    }));

    return { items: formattedItems, total, page, limit };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId: id },
      include: {
        jobPostings: { where: { status: 'APPROVED' } },
        branches: true,
      },
    });

    if (!company) {
      throw new NotFoundException(`Không tìm thấy công ty với ID ${id}`);
    }

    return company;
  }

  async getMyCompany(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: {
        company: {
          include: { branches: true },
        },
      },
    });
    if (!recruiter || !recruiter.company) {
      return {};
    }
    return recruiter.company;
  }

  async updateMyCompany(userId: string, updateData: any) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    if (!recruiter.companyId) {
      // Create a new company
      const newCompany = await this.prisma.company.create({
        data: updateData,
      });

      // Connect it manually to avoid nested syntax errors
      await this.prisma.recruiter.update({
        where: { recruiterId: recruiter.recruiterId },
        data: { companyId: newCompany.companyId },
      });

      return newCompany;
    }

    return this.prisma.company.update({
      where: { companyId: recruiter.companyId },
      data: updateData,
    });
  }

  async uploadLogo(userId: string, file: Express.Multer.File) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException('Chưa có thông tin công ty.');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `logo-${recruiter.companyId}-${Date.now()}.${fileExt}`;
    const path = `companies/logos/${fileName}`;
    const url = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    await this.prisma.company.update({
      where: { companyId: recruiter.companyId },
      data: { logo: url },
    });
    return { url };
  }

  async uploadBanner(userId: string, file: Express.Multer.File) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException('Chưa có thông tin công ty.');
    }

    const fileExt = file.originalname.split('.').pop();
    const fileName = `banner-${recruiter.companyId}-${Date.now()}.${fileExt}`;
    const path = `companies/banners/${fileName}`;
    const url = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    await this.prisma.company.update({
      where: { companyId: recruiter.companyId },
      data: { banner: url },
    });
    return { url };
  }

  async addBranch(userId: string, data: { name: string; address: string; latitude?: number; longitude?: number }) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException('Recruiter or company not found');
    }

    let latitude: number | null = data.latitude ?? null;
    let longitude: number | null = data.longitude ?? null;
    let isVerified = latitude !== null && longitude !== null;

    if (!isVerified) {
      try {
        let query = encodeURIComponent(data.address);
        let res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
          {
            headers: { 'User-Agent': 'Workly-System' },
          },
        );
        if (res.ok) {
          let json = await res.json();
          if (json && json.length > 0) {
            latitude = parseFloat(json[0].lat);
            longitude = parseFloat(json[0].lon);
            isVerified = true;
          } else {
            // Fallback: Try with an extracting just the administrative divisions (last 3 comma-separated parts)
            const parts = data.address.split(',');
            if (parts.length > 2) {
              const simplifiedAddress = parts.slice(Math.max(parts.length - 3, 0)).join(',').trim();
              query = encodeURIComponent(simplifiedAddress);
              res = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
                {
                  headers: { 'User-Agent': 'Workly-System' },
                },
              );
              if (res.ok) {
                json = await res.json();
                if (json && json.length > 0) {
                  latitude = parseFloat(json[0].lat);
                  longitude = parseFloat(json[0].lon);
                  isVerified = true;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Nominatim search error:', e);
      }
    }

    return this.prisma.companyBranch.create({
      data: {
        name: data.name,
        address: data.address,
        latitude,
        longitude,
        isVerified,
        companyId: recruiter.companyId,
      },
    });
  }

  async deleteBranch(userId: string, branchId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter || !recruiter.companyId) throw new NotFoundException();

    return this.prisma.companyBranch.deleteMany({
      where: {
        branchId,
        companyId: recruiter.companyId,
      },
    });
  }

  async getTopEmployers(limit = 10) {
    const companies = await this.prisma.company.findMany({
      take: limit,
      include: {
        _count: {
          select: { jobPostings: { where: { status: 'APPROVED' } } },
        },
      },
      orderBy: {
        jobPostings: {
          _count: 'desc',
        },
      },
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
}
