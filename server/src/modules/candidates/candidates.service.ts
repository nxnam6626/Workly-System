import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: any) {
    const { skip = 0, take = 10, search, skills, major } = query;
    const where: any = {};

    if (search) {
      where.fullName = { contains: search, mode: 'insensitive' };
    }
    if (major) {
      where.major = { contains: major, mode: 'insensitive' };
    }
    if (skills) {
      where.skills = {
        some: { skillName: { contains: skills, mode: 'insensitive' } }
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.candidate.findMany({
        where,
        skip: Number(skip),
        take: Number(take),
        include: { user: { select: { email: true, phoneNumber: true, avatar: true } }, skills: true, cvs: true },
      }),
      this.prisma.candidate.count({ where }),
    ]);

    return { data, meta: { total, skip: Number(skip), take: Number(take) } };
  }

  async findOne(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { user: { select: { email: true, phoneNumber: true, avatar: true } }, skills: true, cvs: true },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return candidate;
  }

  async create(createCandidateDto: any) {
    return this.prisma.candidate.create({
      data: createCandidateDto,
    });
  }

  async update(candidateId: string, updateCandidateDto: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { candidateId } });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return this.prisma.candidate.update({
      where: { candidateId },
      data: updateCandidateDto,
    });
  }

  async remove(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { candidateId } });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    return this.prisma.candidate.delete({
      where: { candidateId },
    });
  }

  async toggleSave(candidateId: string, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const { savedCandidateIds } = recruiter;
    const isSaved = savedCandidateIds.includes(candidateId);

    const newSavedCandidateIds = isSaved
      ? savedCandidateIds.filter(id => id !== candidateId)
      : [...savedCandidateIds, candidateId];

    await this.prisma.recruiter.update({
      where: { userId },
      data: { savedCandidateIds: newSavedCandidateIds },
    });

    return { saved: !isSaved, candidateId };
  }

  async getSavedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    return this.prisma.candidate.findMany({
      where: { candidateId: { in: recruiter.savedCandidateIds } },
      include: { user: { select: { email: true, phoneNumber: true, avatar: true } }, skills: true, cvs: true },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.candidate.findUnique({
      where: { userId },
      include: {
        user: { select: { email: true, phoneNumber: true, avatar: true } },
        skills: true,
        cvs: { orderBy: { createdAt: 'desc' } }
      },
    });
  }
}
