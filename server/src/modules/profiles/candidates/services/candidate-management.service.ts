import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CandidateManagementService {
  private readonly logger = new Logger(CandidateManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) {}

  private mapToSkillLevel(level: string): any {
    if (!level) return 'BEGINNER';
    const normalized = level.toUpperCase().trim();
    if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalized)) {
      return normalized;
    }
    if (
      normalized.includes('CƠ BẢN') ||
      normalized.includes('MỚI') ||
      normalized === 'TỐT' ||
      normalized === 'KHÁ'
    ) {
      return 'BEGINNER';
    }
    if (
      normalized.includes('TRUNG CẤP') ||
      normalized.includes('KHOẢNG') ||
      normalized.includes('THÀNH THẠO')
    ) {
      return 'INTERMEDIATE';
    }
    if (
      normalized.includes('CAO CẤP') ||
      normalized.includes('CHUYÊN GIA') ||
      normalized.includes('XUẤT SẮC')
    ) {
      return 'ADVANCED';
    }
    return 'BEGINNER';
  }


  async update(candidateId: string, updateCandidateDto: any) {
    this.logger.log(`[CandidateManagement] Cập nhật hồ sơ cho Candidate ID: ${candidateId}`);
    this.logger.debug(`[CandidateManagement] Dữ liệu nhận được: ${JSON.stringify(updateCandidateDto)}`);
    
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { user: true },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (updateCandidateDto.isOpenToWork === true && candidate.isOpenToWork === false) {
       const now = new Date();
       const expiry = candidate.jobSearchExpiresAt ? new Date(candidate.jobSearchExpiresAt) : null;
       if (!expiry || expiry <= now) {
         throw new BadRequestException('JOB_SEARCH_EXPIRED');
       }
    }

    const {
      skills,
      projects,
      experiences,
      certifications,
      fullName,
      phone,
      gender,
      birthYear,
      currentSalary,
      degree,
      industries,
      languages,
      softSkills,
      interests,
      otherInfo,
      ...rest
    } = updateCandidateDto;

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedCandidate = await tx.candidate.update({
        where: { candidateId },
        data: {
          ...rest,
          ...(fullName && { fullName }),
          ...(gender !== undefined && { gender }),
          ...(birthYear !== undefined && { birthYear }),
          ...(currentSalary !== undefined && { currentSalary }),
          ...(degree !== undefined && { degree }),
          ...(industries !== undefined && { industries }),
          ...(languages !== undefined && { languages }),
          ...(softSkills !== undefined && { softSkills }),
          ...(interests !== undefined && { interests }),
        },
      });

      if (phone) {
        await tx.user.update({
          where: { userId: candidate.userId },
          data: {
            phoneNumber: phone,
          },
        });
      }

      if (skills && Array.isArray(skills)) {
        await tx.skill.deleteMany({ where: { candidateId } });
        if (skills.length > 0) {
          await tx.skill.createMany({
            data: skills.map((s: any) => ({
              candidateId,
              skillName: typeof s === 'string' ? s : s.skillName,
              category: typeof s === 'string' ? 'Khác' : s.category || 'Khác',
              level:
                typeof s === 'string'
                  ? 'BEGINNER'
                  : this.mapToSkillLevel(s.level),
            })),
          });
        }
      }

      if (projects && Array.isArray(projects)) {
        await tx.project.deleteMany({ where: { candidateId } });
        if (projects.length > 0) {
          await tx.project.createMany({
            data: projects.map((p: any) => ({
              candidateId,
              projectName: p.projectName,
              description: p.description,
              role: p.role,
              technology: p.technology,
            })),
          });
        }
      }

      if (experiences && Array.isArray(experiences)) {
        await tx.experience.deleteMany({ where: { candidateId } });
        if (experiences.length > 0) {
          await tx.experience.createMany({
            data: experiences.map((exp: any) => ({
              candidateId,
              company: exp.company || 'Unknown',
              role: exp.role || 'Unknown',
              duration: exp.duration || 'Unknown',
              description: exp.description || '',
            })),
          });
        }
      }

      if (certifications && Array.isArray(certifications)) {
        await tx.certification.deleteMany({ where: { candidateId } });
        if (certifications.length > 0) {
          await tx.certification.createMany({
            data: certifications.map((cert: any) => ({
              candidateId,
              name: typeof cert === 'string' ? cert : cert.name || cert,
            })),
          });
        }
      }

      return updatedCandidate;
    });

    // Fetch full profile data after update to ensure frontend state consistency
    return this.prisma.user.findUnique({
      where: { userId: candidate.userId },
      select: {
        userId: true,
        email: true,
        status: true,
        phoneNumber: true,
        avatar: true,
        createdAt: true,
        lastLogin: true,
        provider: true,
        userRoles: { include: { role: true } },
        candidate: {
          select: {
            candidateId: true,
            fullName: true,
            university: true,
            major: true,
            gpa: true,
            summary: true,
            desiredJob: true,
            isOpenToWork: true,
            jobSearchExpiresAt: true,
            gender: true,
            birthYear: true,
            location: true,
            totalYearsExp: true,
            currentSalary: true,
            degree: true,
            industries: true,
            languages: true,
            softSkills: true,
            interests: true,
            skills: true,
            experiences: { orderBy: { duration: 'desc' } },
            projects: true,
            certifications: true,
            cvs: {
              select: {
                cvId: true,
                cvTitle: true,
                fileUrl: true,
                isMain: true,
                createdAt: true,
                parsedData: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async remove(candidateId: string) {
    return this.prisma.candidate.delete({
      where: { candidateId },
    });
  }
}
