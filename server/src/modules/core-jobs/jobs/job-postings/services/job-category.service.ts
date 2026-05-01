import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { HIERARCHICAL_INDUSTRIES, TECH_MAPPING } from '../constants/industries';

@Injectable()
export class JobCategoryService {
  private readonly logger = new Logger(JobCategoryService.name);

  constructor(private prisma: PrismaService) {}

  getHierarchicalIndustries() {
    return HIERARCHICAL_INDUSTRIES;
  }

  identifyCategories(
    title: string,
    description?: string,
    skills?: string[],
  ): string[] {
    const textToAnalyze =
      `${title} ${description || ''} ${skills?.join(' ') || ''}`.toLowerCase();
    const suggestions = new Set<string>();

    // 1. Phân tích dựa trên HIERARCHICAL_INDUSTRIES
    HIERARCHICAL_INDUSTRIES.forEach((group) => {
      // Check top-level keywords
      if (
        group.keywords.some((kw) => textToAnalyze.includes(kw.toLowerCase()))
      ) {
        suggestions.add(group.category);
      }

      // Check subcategories names as keywords
      group.subCategories.forEach((sub) => {
        const subClean = sub
          .replace(/\(.*\)/, '')
          .trim()
          .toLowerCase();
        if (
          textToAnalyze.includes(subClean) ||
          (sub.includes('/') &&
            sub
              .split('/')
              .some((p) => textToAnalyze.includes(p.trim().toLowerCase())))
        ) {
          suggestions.add(sub);
          suggestions.add(group.category);
        }
      });
    });

    // 2. Mapping từ khóa kỹ thuật chuyên sâu
    for (const [standardSub, kws] of Object.entries(TECH_MAPPING)) {
      if (kws.some((kw) => textToAnalyze.includes(kw.toLowerCase()))) {
        suggestions.add(standardSub);

        const parent = HIERARCHICAL_INDUSTRIES.find((g) =>
          g.subCategories.includes(standardSub),
        );
        if (parent) suggestions.add(parent.category);
      }
    }

    if (suggestions.size === 0) suggestions.add('Đa lĩnh vực / Khác');

    return Array.from(suggestions).slice(0, 8);
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
}
