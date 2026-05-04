import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class CandidateManagementService {
  private readonly logger = new Logger(CandidateManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

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

  async create(createCandidateDto: any) {
    return this.prisma.candidate.create({
      data: createCandidateDto,
    });
  }

  async update(candidateId: string, updateCandidateDto: any) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { user: true },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
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
      ...rest
    } = updateCandidateDto;

    return this.prisma.$transaction(async (tx) => {
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
  }

  async remove(candidateId: string) {
    return this.prisma.candidate.delete({
      where: { candidateId },
    });
  }
}
