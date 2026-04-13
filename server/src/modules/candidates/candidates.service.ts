import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CvParsingService } from './cv-parsing.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { MatchingService } from '../search/matching.service';
import * as crypto from 'crypto';
import { extname } from 'path';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvParsingService: CvParsingService,
    private readonly supabaseService: SupabaseService,
    private readonly matchingService: MatchingService,
  ) {}

  async findAll(query: any, recruiterUserId?: string) {
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
        // Fetch unlocked candidate IDs
        const unlocked = await this.prisma.candidateUnlock.findMany({
          where: { recruiterId: recruiter.recruiterId },
          select: { candidateId: true },
        });
        const unlockedIds = new Set(unlocked.map(u => u.candidateId));

        // Fetch active jobs for matching
        const activeJobs = await this.prisma.jobPosting.findMany({
           where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
           select: { structuredRequirements: true, title: true }
        });

        // Enrich data
        enrichedData = data.map((candidate) => {
          const isUnlocked = unlockedIds.has(candidate.candidateId);
          
          let maxScore = 0;
          let bestJob = '';
          
          // Calculate matching score natively
          const mainCv = candidate.cvs?.find(c => c.isMain) || candidate.cvs?.[0];
          if (mainCv && mainCv.parsedData) {
            const parsedData = mainCv.parsedData as any;
            const cvSkills = parsedData.skills || [];
            const cvExp = parsedData.totalYearsExp || 0;
            
            for (const job of activeJobs) {
               if (!job.structuredRequirements) continue;
               const reqs = job.structuredRequirements as any;
               const { hardSkills = [], softSkills = [], minExperienceYears = 0 } = reqs;

               const matchedHard = hardSkills.filter((s: string) =>
                 cvSkills.some((cs: any) => {
                   const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
                   return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
                 }),
               );
               const hardScore = hardSkills.length > 0 ? matchedHard.length / hardSkills.length : 1;

               const matchedSoft = softSkills.filter((s: string) =>
                 cvSkills.some((cs: any) => {
                   const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
                   return skillStr && skillStr.toLowerCase().includes(s.toLowerCase());
                 }),
               );
               const softScore = softSkills.length > 0 ? matchedSoft.length / softSkills.length : 1;
               const skillScore = hardScore * 0.8 + softScore * 0.2;

               const expScore = cvExp >= minExperienceYears ? 1 : cvExp / (minExperienceYears || 1);
               
               const totalScore = Math.round((skillScore * 0.7 + expScore * 0.3) * 100);
               if (totalScore > maxScore) {
                  maxScore = totalScore;
                  bestJob = job.title;
               }
            }
          }

          return {
            ...candidate,
            fullName: isUnlocked ? candidate.fullName : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
            user: {
              ...candidate.user,
              avatar: isUnlocked ? candidate.user?.avatar : null,
              email: isUnlocked ? candidate.user?.email : '****@***.com',
              phoneNumber: isUnlocked ? candidate.user?.phoneNumber : '****-***-***'
            },
            isUnlocked,
            matchScore: maxScore,
            bestMatchJob: bestJob
          };
        });
      }
    }

    return { data: enrichedData, meta: { total, skip: Number(skip), take: Number(take) } };
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
          where: { recruiterId: recruiter.recruiterId, candidateId: candidate.candidateId }
        });
        const isUnlocked = !!unlockedInfo;

        enrichedCandidate = {
          ...candidate,
          fullName: isUnlocked ? candidate.fullName : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
          user: {
            ...candidate.user,
            avatar: isUnlocked ? candidate.user?.avatar : null,
            email: isUnlocked ? candidate.user?.email : '****@***.com',
            phoneNumber: isUnlocked ? candidate.user?.phoneNumber : '****-***-***'
          },
          isUnlocked
        }
      }
    }

    return enrichedCandidate;
  }

  async uploadCvOnly(userId: string, file: Express.Multer.File) {
    const buffer = file.buffer;
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    // Kiểm tra trùng lặp
    const candidate = await this.findByUserId(userId);
    if (candidate) {
      const duplicate = await this.findByHash(candidate.candidateId, fileHash);
      if (duplicate) {
        throw new ConflictException('CV này đã có trong danh sách của bạn.');
      }
    }

    // Upload lên Supabase
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `cv-extract-${uniqueSuffix}${extname(file.originalname)}`;
    const path = `${userId}/${fileName}`;
    const fileUrl = await this.supabaseService.uploadFile(
      buffer,
      path,
      file.mimetype,
    );

    const cvTitle = file.originalname.split('.')[0];

    // Kiểm tra xem đây có phải là CV đầu tiên không
    const cvCount = candidate
      ? await this.prisma.cV.count({
          where: { candidateId: candidate.candidateId },
        })
      : 0;
    const isMain = cvCount === 0;

    // BƯỚC 1: Lưu bản ghi CV vào database trước (Lưu nháp - Trang thái: Uploaded)
    return this.saveCv(userId, {
      cvTitle,
      fileUrl,
      isMain,
      parsedData: null,
      fileHash,
    });
  }

  async analyzeCv(userId: string, cvId: string) {
    // 1. Kiểm tra quyền sở hữu và lấy thông tin CV
    const candidate = await this.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, candidateId: true, fileUrl: true },
    });

    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    if (!cv.fileUrl)
      throw new BadRequestException('CV does not have a file URL');

    try {
      // 2. Tải tệp từ Supabase
      const path = this.supabaseService.extractPathFromUrl(cv.fileUrl);
      if (!path) throw new BadRequestException('Invalid file path in URL');

      const buffer = await this.supabaseService.downloadFile(path);

      // 3. Tiến hành bóc tách AI
      const rawText = await this.cvParsingService.extractTextFromPdf(buffer);
      const extractedData = await this.cvParsingService.parseCv(rawText);

      if (extractedData) {
        // 4. Cập nhật dữ liệu bóc tách vào bản ghi
        return this.updateCv(userId, cv.cvId, {
          parsedData: extractedData,
        });
      }

      return this.updateCv(userId, cv.cvId, {});
    } catch (error) {
      console.error('[CandidatesService] Error analyzing CV:', error);
      throw error;
    }
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

    const { skills, projects, fullName, phone, ...rest } = updateCandidateDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Candidate basic info (university, major, gpa, etc.)
      const updatedCandidate = await tx.candidate.update({
        where: { candidateId },
        data: rest,
      });

      // 2. Update User (fullName, phoneNumber)
      if (fullName || phone) {
        await tx.user.update({
          where: { userId: candidate.userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phoneNumber: phone }),
          },
        });
      }

      // 3. Update Skills if provided
      if (skills && Array.isArray(skills)) {
        await tx.skill.deleteMany({ where: { candidateId } });
        if (skills.length > 0) {
          await tx.skill.createMany({
            data: skills.map((s: any) => ({
              candidateId,
              skillName: typeof s === 'string' ? s : s.skillName,
              level: typeof s === 'string' ? 'BEGINNER' : s.level || 'BEGINNER',
            })),
          });
        }
      }

      // 4. Update Projects if provided
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

      return updatedCandidate;
    });
  }

  async remove(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

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

    // Fetch unlocked candidate IDs
    const unlocked = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
      select: { candidateId: true },
    });
    const unlockedIds = new Set(unlocked.map(u => u.candidateId));

    return savedCandidates.map(candidate => {
      const isUnlocked = unlockedIds.has(candidate.candidateId);
      return {
        ...candidate,
        fullName: isUnlocked ? candidate.fullName : `Ứng viên #${candidate.candidateId.slice(0, 4)}`,
        user: {
          ...candidate.user,
          avatar: isUnlocked ? candidate.user?.avatar : null,
          email: isUnlocked ? candidate.user?.email : '****@***.com',
          phoneNumber: isUnlocked ? candidate.user?.phoneNumber : '****-***-***'
        },
        isUnlocked
      };
    });
  }

  async saveCv(userId: string, saveCvDto: any) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    // Auto-create candidate if missing
    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');

      candidate = await this.prisma.candidate.create({
        data: {
          userId,
          fullName: user.email.split('@')[0],
        },
      });
    }

    const { cvTitle, fileUrl, isMain, parsedData, fileHash } = saveCvDto;

    // If isMain is true, unset other main CVs
    if (isMain) {
      await this.prisma.cV.updateMany({
        where: { candidateId: candidate.candidateId, isMain: true },
        data: { isMain: false },
      });
    }

    return this.prisma.cV.create({
      data: {
        cvTitle,
        fileUrl,
        isMain: isMain ?? false,
        candidateId: candidate.candidateId,
        parsedData,
        fileHash, // Thêm fileHash vào đây
      },
      select: {
        cvId: true,
        cvTitle: true,
        fileUrl: true,
        isMain: true,
        createdAt: true,
        parsedData: true,
        fileHash: true,
      },
    });
  }

  async findByHash(candidateId: string, fileHash: string) {
    return this.prisma.cV.findFirst({
      where: { candidateId, fileHash },
      select: {
        cvId: true,
        cvTitle: true,
        fileUrl: true,
        isMain: true,
        createdAt: true,
      },
    });
  }

  async updateCv(userId: string, cvId: string, updateCvDto: any) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');
      candidate = await this.prisma.candidate.create({
        data: { userId, fullName: user.email.split('@')[0] },
      });
    }

    const cv = await this.prisma.cV.findUnique({ where: { cvId } });
    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    const { cvTitle, fileUrl, isMain, parsedData } = updateCvDto;

    // If isMain is true, unset other main CVs
    if (isMain) {
      await this.prisma.cV.updateMany({
        where: {
          candidateId: candidate.candidateId,
          isMain: true,
          NOT: { cvId },
        },
        data: { isMain: false },
      });
    }

    return this.prisma.cV.update({
      where: { cvId },
      data: {
        ...(cvTitle && { cvTitle }),
        ...(fileUrl && { fileUrl }),
        ...(isMain !== undefined && { isMain }),
        ...(parsedData && { parsedData }),
      },
      select: {
        cvId: true,
        cvTitle: true,
        fileUrl: true,
        isMain: true,
        createdAt: true,
        parsedData: true,
      },
    });
  }

  async findByUserId(userId: string) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { userId },
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
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // Auto-create candidate if missing but user is logged in
    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) return null;

      candidate = (await this.prisma.candidate.create({
        data: {
          userId,
          fullName: user.email.split('@')[0],
        },
        include: {
          user: { select: { email: true, phoneNumber: true, avatar: true } },
          skills: true,
          cvs: true,
        },
      })) as any;
    }

    return candidate;
  }

  async setMainCv(userId: string, cvId: string) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');
      candidate = await this.prisma.candidate.create({
        data: { userId, fullName: user.email.split('@')[0] },
      });
    }

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, candidateId: true },
    });
    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    return this.prisma.$transaction(async (tx) => {
      // Unset all main CVs
      await tx.cV.updateMany({
        where: { candidateId: candidate.candidateId, isMain: true },
        data: { isMain: false },
      });

      // Set this one as main
      return tx.cV.update({
        where: { cvId },
        data: { isMain: true },
      });
    });
  }

  async deleteCv(userId: string, cvId: string) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');
      candidate = await this.prisma.candidate.create({
        data: { userId, fullName: user.email.split('@')[0] },
      });
    }

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, candidateId: true, fileUrl: true },
    });
    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    // Xóa tệp trên Supabase nếy có URL
    if (cv.fileUrl) {
      const path = this.supabaseService.extractPathFromUrl(cv.fileUrl);
      if (path) {
        try {
          await this.supabaseService.deleteFile(path);
        } catch (e) {
          console.error(`Failed to delete file from Supabase: ${path}`, e);
        }
      }
    }

    return this.prisma.cV.delete({
      where: { cvId },
    });
  }

  async getRecommendedJobs(userId: string) {
    return this.matchingService.runMatchingForCandidate(userId);
  }
}
