import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CandidateProfileService {
  private readonly logger = new Logger(CandidateProfileService.name);

  constructor(private readonly prisma: PrismaService) { }

  private mapToSkillLevel(level: string): any {
    if (!level) return 'BEGINNER';
    const normalized = level.toUpperCase().trim();
    if (['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(normalized)) {
      return normalized;
    }
    if (normalized.includes('CƠ BẢN') || normalized.includes('MỚI') || normalized === 'TỐT' || normalized === 'KHÁ') {
      return 'BEGINNER';
    }
    if (normalized.includes('TRUNG CẤP') || normalized.includes('KHOẢNG') || normalized.includes('THÀNH THẠO')) {
      return 'INTERMEDIATE';
    }
    if (normalized.includes('CAO CẤP') || normalized.includes('CHUYÊN GIA') || normalized.includes('XUẤT SẮC')) {
      return 'ADVANCED';
    }
    return 'BEGINNER';
  }

  async findAll(query: any, recruiterUserId?: string) {
    const { skip = 0, take = 50, search, skills, major } = query;
    const where: any = {
      user: {
        status: 'ACTIVE',
      },
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { major: { contains: search, mode: 'insensitive' } },
        {
          skills: {
            some: { skillName: { contains: search, mode: 'insensitive' } },
          },
        },
      ];
    }
    if (major) {
      where.major = { contains: major, mode: 'insensitive' };
    }
    if (skills) {
      where.skills = {
        some: { skillName: { contains: skills, mode: 'insensitive' } },
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: {
          user: { select: { email: true, phoneNumber: true, avatar: true } },
          skills: true,
          cvs: {
            select: {
              cvId: true,
              cvTitle: true,
              fileUrl: true,
              isMain: true,
              parsedData: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    let enrichedData = data as any[];

    if (recruiterUserId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId: recruiterUserId },
      });

      if (recruiter) {
        const unlocked = await this.prisma.candidateUnlock.findMany({
          where: { recruiterId: recruiter.recruiterId },
          select: { candidateId: true },
        });
        const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

        const activeJobs = await this.prisma.jobPosting.findMany({
          where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
          select: { jobPostingId: true, title: true },
        });
        const activeJobIds = activeJobs.map(j => j.jobPostingId);
        const jobTitleMap = new Map(activeJobs.map(j => [j.jobPostingId, j.title]));

        const candidateIds = data.map(c => c.candidateId);
        const allMatches = await this.prisma.jobMatch.findMany({
          where: {
            candidateId: { in: candidateIds },
            jobPostingId: { in: activeJobIds },
          },
        });

        const matchesByCandidate = allMatches.reduce((acc, match) => {
          let list = acc.get(match.candidateId);
          if (!list) {
            list = [];
            acc.set(match.candidateId, list);
          }
          list.push(match);
          return acc;
        }, new Map<string, any[]>());

        enrichedData = data.map((candidate) => {
          const isUnlocked = unlockedIds.has(candidate.candidateId);
          const candidateMatches = matchesByCandidate.get(candidate.candidateId) || [];
          candidateMatches.sort((a, b) => b.score - a.score);

          const maxScore = candidateMatches.length > 0 ? candidateMatches[0].score : 0;
          const bestJobId = candidateMatches.length > 0 ? candidateMatches[0].jobPostingId : null;
          const bestJob = bestJobId ? jobTitleMap.get(bestJobId) : '';

          const matchDetails = candidateMatches
            .slice(0, 3)
            .map(m => ({
              title: jobTitleMap.get(m.jobPostingId) || '',
              score: m.score
            }));

          return {
            ...candidate,
            fullName: isUnlocked
              ? candidate.fullName
              : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
            user: {
              ...candidate.user,
              avatar: isUnlocked ? candidate.user?.avatar : null,
              email: isUnlocked ? candidate.user?.email : '****@***.com',
              phoneNumber: isUnlocked
                ? candidate.user?.phoneNumber
                : '****-***-***',
            },
            isUnlocked,
            matchScore: maxScore,
            bestMatchJob: bestJob,
            matchDetails,
          };
        });
      }
      enrichedData.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return {
      data: enrichedData,
      meta: { total, skip: Number(skip), take: Number(take) },
    };
  }

  async findOne(candidateId: string, recruiterUserId?: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        cvs: {
          select: {
            cvId: true,
            cvTitle: true,
            fileUrl: true,
            isMain: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    let enrichedCandidate = candidate as any;

    if (recruiterUserId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId: recruiterUserId },
      });

      if (recruiter) {
        const unlockedInfo = await this.prisma.candidateUnlock.findFirst({
          where: {
            recruiterId: recruiter.recruiterId,
            candidateId: candidate.candidateId,
          },
        });
        const isUnlocked = !!unlockedInfo;

        enrichedCandidate = {
          ...candidate,
          fullName: isUnlocked
            ? candidate.fullName
            : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
          user: {
            ...candidate.user,
            avatar: isUnlocked ? candidate.user?.avatar : null,
            email: isUnlocked ? candidate.user?.email : '****@***.com',
            phoneNumber: isUnlocked
              ? candidate.user?.phoneNumber
              : '****-***-***',
          },
          isUnlocked,
        };
      }
    }

    return enrichedCandidate;
  }

  async findByUserId(userId: string): Promise<any> {
    let candidate: any = await this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        experiences: true,
        cvs: {
          select: {
            cvId: true,
            cvTitle: true,
            fileUrl: true,
            isMain: true,
            parsedData: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) return null;

      candidate = await this.prisma.candidate.create({
        data: {
          userId,
          fullName: user.email.split('@')[0],
        },
        include: {
          user: { select: { email: true, phoneNumber: true, avatar: true } },
          skills: true,
          cvs: true,
        },
      });
    }

    return candidate;
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
              level: typeof s === 'string' ? 'BEGINNER' : this.mapToSkillLevel(s.level),
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

  async toggleSave(candidateId: string, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const { savedCandidateIds } = recruiter;
    const isSaved = savedCandidateIds.includes(candidateId);

    const newSavedCandidateIds = isSaved
      ? savedCandidateIds.filter((id) => id !== candidateId)
      : [...savedCandidateIds, candidateId];

    await this.prisma.recruiter.update({
      where: { userId },
      data: { savedCandidateIds: newSavedCandidateIds },
    });

    return { saved: !isSaved, candidateId };
  }

  async getSavedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const savedCandidates = await this.prisma.candidate.findMany({
      where: { candidateId: { in: recruiter.savedCandidateIds } },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        cvs: {
          select: {
            cvId: true,
            cvTitle: true,
            fileUrl: true,
            isMain: true,
            parsedData: true,
            createdAt: true,
          },
        },
      },
    });

    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
      select: { candidateId: true },
    });
    const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

    return savedCandidates.map((candidate) => {
      const isUnlocked = unlockedIds.has(candidate.candidateId);
      return {
        ...candidate,
        fullName: isUnlocked
          ? candidate.fullName
          : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
        user: {
          ...candidate.user,
          avatar: isUnlocked ? candidate.user?.avatar : null,
          email: isUnlocked ? candidate.user?.email : '****@***.com',
          phoneNumber: isUnlocked
            ? candidate.user?.phoneNumber
            : '****-***-***',
        },
        isUnlocked,
      };
    });
  }
}
