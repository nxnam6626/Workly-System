import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { MappedJobData } from '../interfaces/rapid-job.interface';
import { JobStatus, PostType } from '@prisma/client';

@Injectable()
export class JobSyncService {
  private readonly logger = new Logger(JobSyncService.name);

  constructor(private readonly prisma: PrismaService) { }

  async syncJobToDb(
    mappedData: MappedJobData,
    reliabilityScore: number,
  ) {
    const { jobData, companyData } = mappedData;

    if (!jobData.originalUrl) {
      this.logger.debug(`[syncJobToDb] Bỏ qua "${jobData.title}" — không có originalUrl`);
      return null;
    }

    return this.prisma.$transaction(async (tx) => {
      // ── Bước 1: Find or Create Company ──────────────────────────────────
      let company = await tx.company.findFirst({
        where: { companyName: companyData.companyName },
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            companyName: companyData.companyName,
            logo: companyData.logo,
            websiteUrl: companyData.websiteUrl,
            description: companyData.description,
            address: companyData.address,
            companySize: companyData.companySize,
            isRegistered: false,
            verifyStatus: 0,
          },
        });
        this.logger.debug(`[Company] Tạo mới: "${company.companyName}"`);
      } else {
        if (!company.companySize && companyData.companySize) {
          await tx.company.update({
            where: { companyId: company.companyId },
            data: { companySize: companyData.companySize },
          });
        }
      }

      // ── Bước 2: Upsert JobPosting ────────────────────────────────────────
      return tx.jobPosting.upsert({
        where: { originalUrl: jobData.originalUrl },
        update: {
          title: jobData.title,
          description: jobData.description || null,
          requirements: jobData.requirements || null,
          benefits: jobData.benefits || null,
          locationCity: jobData.locationCity || null,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency || 'VND',
          jobType: jobData.jobType,
          experience: jobData.experience,
          deadline: jobData.deadline,
          vacancies: jobData.vacancies,
          aiReliabilityScore: reliabilityScore,
          updatedAt: new Date(),
        },
        create: {
          title: jobData.title,
          description: jobData.description || null,
          requirements: jobData.requirements || null,
          benefits: jobData.benefits || null,
          originalUrl: jobData.originalUrl,
          locationCity: jobData.locationCity || null,
          salaryMin: jobData.salaryMin,
          salaryMax: jobData.salaryMax,
          currency: jobData.currency || 'VND',
          jobType: jobData.jobType,
          experience: jobData.experience,
          deadline: jobData.deadline,
          vacancies: jobData.vacancies,
          companyId: company.companyId,
          status: JobStatus.PENDING,
          postType: PostType.CRAWLED,
          aiReliabilityScore: reliabilityScore,
          isVerified: false,
        },
        include: { company: true },
      });
    });
  }
}
