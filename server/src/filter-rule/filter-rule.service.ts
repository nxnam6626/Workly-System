import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFilterRuleDto } from './dto/create-filter-rule.dto';
import { UpdateFilterRuleDto } from './dto/update-filter-rule.dto';

@Injectable()
export class FilterRuleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminId(userId: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
    });
    if (!admin) {
      throw new ForbiddenException('User is not an Admin');
    }
    return admin.adminId;
  }

  async create(userId: string, sourceId: string, createDto: CreateFilterRuleDto) {
    const adminId = await this.getAdminId(userId);

    // Verify source exists
    const source = await this.prisma.crawlSource.findUnique({
      where: { crawlSourceId: sourceId },
    });
    if (!source) {
      throw new NotFoundException(`Crawl source ${sourceId} not found`);
    }

    return this.prisma.filterRule.create({
      data: {
        keyword: createDto.keyword,
        action: createDto.action,
        minReliabilityScore: createDto.minReliabilityScore,
        adminId,
        crawlSourceId: sourceId,
      },
    });
  }

  async findAllBySource(sourceId: string) {
    return this.prisma.filterRule.findMany({
      where: { crawlSourceId: sourceId },
    });
  }

  async findOne(id: string) {
    const rule = await this.prisma.filterRule.findUnique({
      where: { filterRuleId: id },
    });
    if (!rule) {
      throw new NotFoundException(`Filter rule ${id} not found`);
    }
    return rule;
  }

  async update(id: string, updateDto: UpdateFilterRuleDto) {
    await this.findOne(id);

    return this.prisma.filterRule.update({
      where: { filterRuleId: id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    await this.prisma.filterRule.delete({
      where: { filterRuleId: id },
    });
    
    return { message: `Filter rule ${id} deleted successfully` };
  }
}
