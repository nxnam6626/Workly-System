import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FilterCompanyDto } from './dto/filter-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

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
      }),
      this.prisma.company.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const company = await this.prisma.company.findUnique({
      where: { companyId: id },
      include: { jobPostings: { where: { status: 'APPROVED' } } },
    });

    if (!company) {
      throw new NotFoundException(`Không tìm thấy công ty với ID ${id}`);
    }

    return company;
  }

  async getMyCompany(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId }, include: { company: true } });
    if (!recruiter || !recruiter.company) {
      throw new NotFoundException('Recruiter does not belong to any company');
    }
    return recruiter.company;
  }

  async updateMyCompany(userId: string, updateData: any) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    if (!recruiter.companyId) {
      // Create a new company
      const newCompany = await this.prisma.company.create({
        data: updateData
      });

      // Connect it manually to avoid nested syntax errors
      await this.prisma.recruiter.update({
        where: { recruiterId: recruiter.recruiterId },
        data: { companyId: newCompany.companyId }
      });

      return newCompany;
    }

    return this.prisma.company.update({
      where: { companyId: recruiter.companyId },
      data: updateData,
    });
  }
}
