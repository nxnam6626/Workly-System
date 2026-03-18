import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCrawlSourceDto } from './dto/create-crawl-source.dto';
import { UpdateCrawlSourceDto } from './dto/update-crawl-source.dto';

@Injectable()
export class CrawlSourceService {
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

  async create(userId: string, createCrawlSourceDto: CreateCrawlSourceDto) {
    const adminId = await this.getAdminId(userId);
    const {
      sourceName,
      baseUrl,
      isActive,
      titleSelector,
      salarySelector,
      descriptionSelector,
      schedule,
      renderJs,
    } = createCrawlSourceDto;

    return this.prisma.crawlSource.create({
      data: {
        sourceName,
        baseUrl,
        isActive: isActive ?? true,
        admin: {
          connect: { adminId }
        },
        crawlConfig: {
          create: {
            titleSelector,
            salarySelector,
            descriptionSelector,
            schedule,
            renderJs: renderJs ?? false,
          },
        },
      },
      include: {
        crawlConfig: true,
      },
    });
  }

  async findAll() {
    return this.prisma.crawlSource.findMany({
      include: {
        crawlConfig: true,
      },
    });
  }

  async findOne(id: string) {
    const source = await this.prisma.crawlSource.findUnique({
      where: { crawlSourceId: id },
      include: {
        crawlConfig: true,
      },
    });

    if (!source) {
      throw new NotFoundException(`Crawl source with ID ${id} not found`);
    }

    return source;
  }

  async update(id: string, updateDto: UpdateCrawlSourceDto) {
    await this.findOne(id);

    const {
      sourceName,
      baseUrl,
      isActive,
      titleSelector,
      salarySelector,
      descriptionSelector,
      schedule,
      renderJs,
    } = updateDto;

    const updateData: any = {};
    if (sourceName !== undefined) updateData.sourceName = sourceName;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const configUpdate: any = {};
    if (titleSelector !== undefined) configUpdate.titleSelector = titleSelector;
    if (salarySelector !== undefined) configUpdate.salarySelector = salarySelector;
    if (descriptionSelector !== undefined) configUpdate.descriptionSelector = descriptionSelector;
    if (schedule !== undefined) configUpdate.schedule = schedule;
    if (renderJs !== undefined) configUpdate.renderJs = renderJs;

    if (Object.keys(configUpdate).length > 0) {
      updateData.crawlConfig = {
        update: configUpdate,
      };
    }

    return this.prisma.crawlSource.update({
      where: { crawlSourceId: id },
      data: updateData,
      include: {
        crawlConfig: true,
      },
    });
  }

  async remove(id: string) {
    const source = await this.findOne(id);

    return this.prisma.$transaction(async (prisma) => {
      await prisma.crawlSource.delete({
        where: { crawlSourceId: id },
      });
      if (source.crawlConfig) {
        await prisma.crawlConfig.delete({
          where: { crawlConfigId: source.crawlConfigId },
        });
      }
      return { message: `Crawl source ${id} deleted successfully` };
    });
  }

  async getLogs(sourceId?: string) {
    return this.prisma.crawlLog.findMany({
      where: sourceId ? { crawlSourceId: sourceId } : undefined,
      orderBy: { startTime: 'desc' },
      take: 100,
    });
  }
}
