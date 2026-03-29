import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
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
}
