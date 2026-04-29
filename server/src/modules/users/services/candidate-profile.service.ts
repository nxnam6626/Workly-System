import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateCandidateProfileDto } from '../dto/update-candidate-profile.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CandidateProfileService {
  private readonly logger = new Logger(CandidateProfileService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  async updateCandidateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: { candidate: true },
    });
    if (!user || !user.candidate) {
      throw new NotFoundException('Không tìm thấy hồ sơ ứng viên.');
    }

    const candidateId = user.candidate.candidateId;
    this.logger.log(`Updating candidate profile for candidateId: ${candidateId}`);

    await this.prisma.$transaction(async (tx) => {
      // 1. Update Candidate core fields
      await tx.candidate.update({
        where: { candidateId },
        data: {
          ...(dto.fullName && { fullName: dto.fullName }),
          ...(dto.university !== undefined && { university: dto.university }),
          ...(dto.major !== undefined && { major: dto.major }),
          ...(dto.degree !== undefined && { degree: dto.degree }),
          ...(dto.gpa !== undefined && { gpa: dto.gpa }),
          ...(dto.summary !== undefined && { summary: dto.summary }),
          ...(dto.desiredJob !== undefined && { desiredJob: dto.desiredJob }),
          ...(dto.isOpenToWork !== undefined && { isOpenToWork: dto.isOpenToWork }),
          ...(dto.location !== undefined && { location: dto.location }),
          ...(dto.industries !== undefined && { industries: dto.industries }),
          ...(dto.totalYearsExp !== undefined && { totalYearsExp: dto.totalYearsExp }),
          ...(dto.languages !== undefined && { languages: dto.languages as any }),
        },
      });

      // 2. Update User fields (phoneNumber)
      if (dto.phone) {
        await tx.user.update({
          where: { userId },
          data: { phoneNumber: dto.phone },
        });
      }

      // 3. Update Skills
      if (dto.skills !== undefined) {
        await tx.skill.deleteMany({ where: { candidateId } });
        if (dto.skills.length > 0) {
          await tx.skill.createMany({
            data: dto.skills.map((s) => ({
              skillName: s.skillName,
              level: (s.level as any) || 'BEGINNER',
              candidateId,
            })),
          });
        }
      }

      // 4. Update Experiences
      if (dto.experiences !== undefined) {
        await tx.experience.deleteMany({ where: { candidateId } });
        if (dto.experiences.length > 0) {
          await tx.experience.createMany({
            data: dto.experiences.map((exp) => ({ ...exp, candidateId })),
          });
        }
      }

      // 5. Update Projects
      if (dto.projects !== undefined) {
        await tx.project.deleteMany({ where: { candidateId } });
        if (dto.projects.length > 0) {
          await tx.project.createMany({
            data: dto.projects.map((p) => ({ ...p, candidateId })),
          });
        }
      }

      // 6. Update Certifications
      if (dto.certifications !== undefined) {
        await tx.certification.deleteMany({ where: { candidateId } });
        if (dto.certifications.length > 0) {
          await tx.certification.createMany({
            data: dto.certifications.map((cert) => ({ name: cert, candidateId })),
          });
        }
      }
    });

    // 7. Trigger matching analysis
    try {
      await this.matchingQueue.add('match-candidate', { userId });
    } catch (err) {
      this.logger.error(`Failed to trigger matching for userId: ${userId}`, err.stack);
    }
  }
}
