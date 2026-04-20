import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CvParsingService } from './cv-parsing.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { MatchingService } from '../search/matching.service';
import * as crypto from 'crypto';
import { extname } from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvParsingService: CvParsingService,
    private readonly supabaseService: SupabaseService,
    private readonly matchingService: MatchingService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  private readonly logger = new Logger(CandidatesService.name);

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
        // Fetch unlocked candidate IDs
        const unlocked = await this.prisma.candidateUnlock.findMany({
          where: { recruiterId: recruiter.recruiterId },
          select: { candidateId: true },
        });
        const unlockedIds = new Set(unlocked.map((u) => u.candidateId));

        // Fetch active jobs for matching
        const activeJobs = await this.prisma.jobPosting.findMany({
          where: { recruiterId: recruiter.recruiterId, status: 'APPROVED' },
          select: { structuredRequirements: true, title: true },
        });

        // Enrich data
        enrichedData = data.map((candidate) => {
          const isUnlocked = unlockedIds.has(candidate.candidateId);

          let maxScore = 0;
          let bestJob = '';
          const matchDetails: { title: string; score: number }[] = [];

          // Calculate matching score natively
          const mainCv =
            candidate.cvs?.find((c) => c.isMain) || candidate.cvs?.[0];
          if (mainCv && mainCv.parsedData) {
            const parsedData = mainCv.parsedData as any;
            const cvSkills = parsedData.skills || [];
            const cvExp = parsedData.totalYearsExp || 0;

            for (const job of activeJobs) {
              if (!job.structuredRequirements) continue;
              const reqs = job.structuredRequirements as any;
              const {
                hardSkills = [],
                softSkills = [],
                minExperienceYears = 0,
              } = reqs;

              const matchedHard = hardSkills.filter((s: string) =>
                cvSkills.some((cs: any) => {
                  const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
                  return (
                    skillStr && skillStr.toLowerCase().includes(s.toLowerCase())
                  );
                }),
              );
              const hardScore =
                hardSkills.length > 0
                  ? matchedHard.length / hardSkills.length
                  : 1;

              const matchedSoft = softSkills.filter((s: string) =>
                cvSkills.some((cs: any) => {
                  const skillStr = typeof cs === 'string' ? cs : cs?.skillName;
                  return (
                    skillStr && skillStr.toLowerCase().includes(s.toLowerCase())
                  );
                }),
              );
              const softScore =
                softSkills.length > 0
                  ? matchedSoft.length / softSkills.length
                  : 1;
              const skillScore = hardScore * 0.8 + softScore * 0.2;

              const expScore =
                cvExp >= minExperienceYears
                  ? 1
                  : cvExp / (minExperienceYears || 1);

              const totalScore = Math.round(
                (skillScore * 0.7 + expScore * 0.3) * 100,
              );
              
              // Chỉ thêm vào danh sách nếu điểm phù hợp >= 50%
              if (totalScore >= 50) {
                matchDetails.push({ title: job.title, score: totalScore });
              }

              if (totalScore > maxScore) {
                maxScore = totalScore;
                bestJob = job.title;
              }
            }
            
            // Sort matchDetails descending and take top 3
            matchDetails.sort((a, b) => b.score - a.score);
            matchDetails.splice(3);
          }

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

      // Sort by match score descending to surface the most relevant matches first
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

    // Tự động thiết lập CV mới nhất làm CV chính (isMain = true).
    // Hàm saveCv() bên dưới sẽ tự động hủy isMain của các bản CV cũ.
    const isMain = true;

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
      select: { cvId: true, candidateId: true, fileUrl: true, isMain: true },
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
      // Xác định mimeType từ URL để truyền vào service bóc tách
      let mimeType = 'application/pdf'; // mặc định
      const ext = extname(cv.fileUrl).toLowerCase();
      if (ext === '.docx') {
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (ext === '.doc') {
        mimeType = 'application/msword';
      }

      const extractedData = await this.cvParsingService.parseCv(buffer, mimeType);

      if (!extractedData) {
        throw new BadRequestException('Hệ thống AI không thể bóc tách dữ liệu từ CV này.');
      }

      const personal = extractedData.personal_info || {};
      const fullName = personal.full_name || '';
      const hasValidName = fullName.trim() !== '';
      const hasContent =
        (extractedData.skills?.hard_skills?.length > 0 ||
          extractedData.skills?.soft_skills?.length > 0 ||
          extractedData.education?.institution ||
          extractedData.experience?.roles?.length > 0);

      if (!hasValidName || !hasContent) {
        this.logger.warn(
          `[CandidatesService] AI parsing for CV ${cvId} returned partial/insufficient data. Proceeding with caution.`,
        );
      }

      // 4. Kiểm tra xem CV này có phải của người dùng đang đăng nhập hay không
      const cvName = fullName.toLowerCase().trim();
      const accName = (candidate.fullName || '').toLowerCase().trim();

      let isValidName = false;

      if (cvName && accName && accName !== 'người dùng' && accName !== '') {
        const cvTokens = cvName.split(' ');
        const accTokens = accName.split(' ');

        isValidName = cvTokens.some(
          (token) => token.length >= 2 && accTokens.includes(token),
        );

        if (!isValidName) {
          this.logger.warn(
            `[CandidatesService] AI detected name mismatch: CV="${cvName}", Account="${accName}". Warning user but allowing proceed.`,
          );
          (extractedData as any).aiWarning = 'Tên trong CV có thể không khớp với tên tài khoản.';
        }
      }

      // 5. Cập nhật hồ sơ ứng viên nếu còn trống
      const isNameEmpty = !candidate.fullName || candidate.fullName === 'Người dùng' || candidate.fullName === 'người dùng';
      const isPhoneEmpty = !candidate.user?.phoneNumber;
      const isMajorEmpty = !candidate.major;
      const isUniversityEmpty = !candidate.university;
      const isLocationEmpty = !candidate.location;
      const isSkillsEmpty = !candidate.skills || candidate.skills.length === 0;

      const updateData: any = {};
      if (isNameEmpty && fullName) updateData.fullName = fullName;
      if (isPhoneEmpty && personal.phone) updateData.phone = personal.phone;
      if (isLocationEmpty && personal.location) updateData.location = personal.location;
      if (!candidate.gpa && personal.gpa) updateData.gpa = personal.gpa;
      if (!candidate.summary && extractedData.summary) updateData.summary = extractedData.summary;
      if (!candidate.desiredJob && extractedData.desired_job) updateData.desiredJob = extractedData.desired_job;

      if (isMajorEmpty && extractedData.education?.major) {
        updateData.major = extractedData.education.major;
      }
      if (isUniversityEmpty && extractedData.education?.institution) {
        updateData.university = extractedData.education.institution;
      }

      // Mapping Skills
      if (isSkillsEmpty && extractedData.skills) {
        const skills: any[] = [];
        if (extractedData.skills.hard_skills?.length > 0) {
          skills.push(...extractedData.skills.hard_skills.map(s => ({ ...s, category: 'Hard Skill' })));
        }
        if (extractedData.skills.soft_skills?.length > 0) {
          skills.push(...extractedData.skills.soft_skills.map(s => ({ ...s, category: 'Soft Skill' })));
        }
        if (skills.length > 0) updateData.skills = skills;
      }

      // Certifications
      if (extractedData.certifications && extractedData.certifications.length > 0) {
        updateData.certifications = extractedData.certifications;
      }

      if (Object.keys(updateData).length > 0) {
        await this.update(candidate.candidateId, updateData).catch((e) =>
          this.logger.error(`Failed to auto-fill candidate: ${e.message}`),
        );
      }

      // 6. Cập nhật dữ liệu bóc tách vào bản ghi CV
      return this.updateCv(userId, cv.cvId, {
        parsedData: extractedData,
      });
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

    const { skills, projects, experiences, certifications, fullName, phone, ...rest } = updateCandidateDto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update Candidate basic info (university, major, gpa, location, fullName, etc.)
      const updatedCandidate = await tx.candidate.update({
        where: { candidateId },
        data: {
          ...rest,
          ...(fullName && { fullName }),
        },
      });

      // 2. Update User (phoneNumber only)
      if (phone) {
        await tx.user.update({
          where: { userId: candidate.userId },
          data: {
            phoneNumber: phone,
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
              category: typeof s === 'string' ? 'Khác' : s.category || 'Khác',
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
      
      // 5. Update Experiences if provided
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
      
      // 6. Update Certifications if provided
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

    const updatedCv = await this.prisma.cV.update({
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

    // Đồng bộ thông tin từ CV (parsedData) vào hồ sơ chính của ứng viên nếu có
    if (parsedData) {
      const candidateUpdateData: any = {};
      if (parsedData.fullName)
        candidateUpdateData.fullName = parsedData.fullName;
      if (parsedData.phone) candidateUpdateData.phone = parsedData.phone;

      if (parsedData.education && parsedData.education.length > 0) {
        candidateUpdateData.university = parsedData.education[0].school;
        candidateUpdateData.major = parsedData.education[0].major;
      }

      if (parsedData.gpa !== undefined)
        candidateUpdateData.gpa = parsedData.gpa;
      if (parsedData.skills && Array.isArray(parsedData.skills)) {
        candidateUpdateData.skills = parsedData.skills;
      }

      if (Object.keys(candidateUpdateData).length > 0) {
        try {
          await this.update(candidate.candidateId, candidateUpdateData);
        } catch (error) {
          console.error(
            '[CandidatesService] Lỗi khi đồng bộ dữ liệu vào hồ sơ ứng viên:',
            error,
          );
        }
      }
    }

    // Trigger matching for candidate when CV is parsed or set to main
    if (isMain || parsedData) {
      await this.matchingQueue.add('match-candidate', { userId });
      console.log(
        `[CandidatesService] Triggered matching for candidate via BullMQ: ${userId}`,
      );
    }

    return updatedCv;
  }

  async findByUserId(userId: string) {
    let candidate = await this.prisma.candidate.findUnique({
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

    const result = await this.prisma.$transaction(async (tx) => {
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

    // Trigger matching for candidate when CV is set to main
    await this.matchingQueue.add('match-candidate', { userId });
    console.log(
      `[CandidatesService] Triggered matching for candidate via BullMQ: ${userId}`,
    );

    return result;
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
      select: { cvId: true, candidateId: true, fileUrl: true, isMain: true },
    });

    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    // Nếu xóa CV main, hãy thử chọn CV khác làm main (nếu còn)
    if (cv.isMain) {
      const otherCv = await this.prisma.cV.findFirst({
        where: {
          candidateId: candidate.candidateId,
          NOT: { cvId },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (otherCv) {
        await this.prisma.cV.update({
          where: { cvId: otherCv.cvId },
          data: { isMain: true },
        });
        // Trigger matching lại cho CV mặc định mới
        await this.matchingQueue.add('match-candidate', { userId });
      }
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
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate) return [];

    let matches = await this.prisma.jobMatch.findMany({
      where: { candidateId: candidate.candidateId },
      include: {
        jobPosting: {
          include: { company: true, branches: true },
        },
      },
      orderBy: { score: 'desc' },
      take: 20,
    });

    if (matches.length === 0) {
      // Triển khai cơ chế Fallback tự động
      console.log(
        `[CandidatesService] JobMatch is empty for user ${userId}. Running fallback matching...`,
      );
      await this.matchingService.runMatchingForCandidate(userId);

      matches = await this.prisma.jobMatch.findMany({
        where: { candidateId: candidate.candidateId },
        include: {
          jobPosting: {
            include: { company: true, branches: true },
          },
        },
        orderBy: { score: 'desc' },
        take: 20,
      });
    }

    return matches.map((m) => ({
      ...m.jobPosting,
      score: m.score,
      matchedSkills: m.matchedSkills,
    }));
  }
}
