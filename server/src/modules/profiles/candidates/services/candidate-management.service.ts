import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';

@Injectable()
export class CandidateManagementService {
  private readonly logger = new Logger(CandidateManagementService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('matching') private matchingQueue: Queue,
    private readonly notificationsService: NotificationsService,
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

  private normalizeLanguages(languages: any[]): any[] {
    if (!Array.isArray(languages)) return languages;

    return languages.map((l: any) => {
      const name = l.name || l.language || '';
      let certificate = l.certificate || '';
      let score = l.score || '';
      let level = l.level || '';

      // If already has certificate and score, just ensure level is set
      if (certificate && score) {
        level =
          certificate !== 'Tự đánh giá' ? `${certificate} ${score}` : score;
        return {
          name,
          language: name,
          certificate,
          score,
          level,
        };
      }

      // If only level is provided, parse it
      const rawLevel = String(level || score || l.level || '').trim();
      const rawLevelLower = rawLevel.toLowerCase();

      // Check certificate patterns in the level string
      if (rawLevelLower.includes('ielts')) {
        certificate = 'IELTS';
        const match = rawLevel.match(/ielts\s*(\d+(\.\d+)?)/i);
        score = match ? match[1] : '';
      } else if (rawLevelLower.includes('toeic')) {
        certificate = 'TOEIC';
        const match = rawLevel.match(/toeic\s*(\d+)/i);
        score = match ? match[1] : '';
      } else if (rawLevelLower.includes('toefl')) {
        certificate = 'TOEFL';
        const match = rawLevel.match(/toefl\s*(\d+)/i);
        score = match ? match[1] : '';
      } else if (rawLevelLower.includes('vstep')) {
        certificate = 'VSTEP';
        const match = rawLevel.match(/vstep\s*([a-c][1-2])/i);
        score = match ? match[1].toUpperCase() : '';
      } else if (rawLevelLower.includes('hsk')) {
        certificate = 'HSK';
        const match = rawLevel.match(/hsk\s*([1-6])/i);
        score = match ? match[1] : '';
      } else if (
        rawLevelLower.includes('jlpt') ||
        /n[1-5]/i.test(rawLevelLower)
      ) {
        certificate = 'JLPT';
        const match = rawLevel.match(/n([1-5])/i);
        if (match) {
          score = `N${match[1]}`;
        } else {
          const matchJlpt = rawLevel.match(/jlpt\s*n?([1-5])/i);
          score = matchJlpt ? `N${matchJlpt[1]}` : '';
        }
      } else if (rawLevelLower.includes('topik')) {
        certificate = 'TOPIK';
        const match = rawLevel.match(/topik\s*i*v*([1-6])/i);
        score = match ? match[1] : '';
      } else if (
        rawLevelLower.includes('delf') ||
        rawLevelLower.includes('dalf')
      ) {
        certificate = 'DELF/DALF';
        const match = rawLevel.match(/(delf|dalf)\s*([a-c][1-2])/i);
        score = match
          ? `${match[1].toUpperCase()} ${match[2].toUpperCase()}`
          : '';
      } else if (rawLevelLower.includes('goethe')) {
        certificate = 'Goethe';
        const match = rawLevel.match(/(a[1-2]|b[1-2]|c[1-2])/i);
        score = match ? match[1].toUpperCase() : '';
      } else {
        certificate = 'Tự đánh giá';
        if (['beginner', 'cơ bản', 'sơ cấp'].includes(rawLevelLower)) {
          score = 'Cơ bản';
        } else if (
          ['intermediate', 'trung bình', 'trung cấp'].includes(rawLevelLower)
        ) {
          score = 'Trung bình';
        } else if (
          ['advanced', 'thành thạo', 'cao cấp'].includes(rawLevelLower)
        ) {
          score = 'Thành thạo';
        } else {
          score = rawLevel || 'Cơ bản';
        }
      }

      level = certificate !== 'Tự đánh giá' ? `${certificate} ${score}` : score;

      return {
        name,
        language: name,
        certificate,
        score,
        level,
      };
    });
  }

  async update(candidateId: string, updateCandidateDto: any) {
    this.logger.log(
      `[CandidateManagement] Cập nhật hồ sơ cho Candidate ID: ${candidateId}`,
    );
    this.logger.debug(
      `[CandidateManagement] Dữ liệu nhận được: ${JSON.stringify(updateCandidateDto)}`,
    );

    const candidate = await this.prisma.candidate.findUnique({
      where: { candidateId },
      include: { user: true },
    });
    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (
      updateCandidateDto.isOpenToWork === true &&
      candidate.isOpenToWork === false
    ) {
      const now = new Date();
      const expiry = candidate.jobSearchExpiresAt
        ? new Date(candidate.jobSearchExpiresAt)
        : null;
      if (!expiry || expiry <= now) {
        throw new BadRequestException('JOB_SEARCH_EXPIRED');
      }
    }

    const {
      skills,
      projects,
      experiences,
      certifications,
      degrees,
      fullName,
      phone,
      gender,
      birthYear,
      currentSalary,
      industries,
      languages,
      softSkills,
      interests,
      otherInfo,
      ...rest
    } = updateCandidateDto;

    let newCertsList: string[] = [];
    let newDegreesList: string[] = [];

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedCandidate = await tx.candidate.update({
        where: { candidateId },
        data: {
          ...rest,
          ...(fullName && { fullName }),
          ...(gender !== undefined && { gender }),
          ...(birthYear !== undefined && { birthYear }),
          ...(currentSalary !== undefined && { currentSalary }),
          ...(industries !== undefined && { industries }),
          ...(languages !== undefined && {
            languages: this.normalizeLanguages(languages),
          }),
          ...(otherInfo !== undefined && { otherInfo }),
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
        const existingCerts = await tx.certification.findMany({
          where: { candidateId },
        });

        // Find new ones
        const newCerts = certifications.filter((cert: any) => {
          const name = typeof cert === 'string' ? cert : cert.name || '';
          return !existingCerts.some(
            (ec) => ec.name.toLowerCase() === name.toLowerCase(),
          );
        });
        newCertsList = newCerts.map((c: any) =>
          typeof c === 'string' ? c : c.name || '',
        );

        await tx.certification.deleteMany({ where: { candidateId } });
        if (certifications.length > 0) {
          await tx.certification.createMany({
            data: certifications.map((cert: any) => {
              const name = typeof cert === 'string' ? cert : cert.name || '';
              const existing = existingCerts.find(
                (ec) => ec.name.toLowerCase() === name.toLowerCase(),
              );
              return {
                candidateId,
                name,
                issuer:
                  typeof cert === 'string'
                    ? null
                    : cert.organization || cert.issuer || null,
                issueDate:
                  typeof cert === 'string' ? null : cert.issueDate || null,
                credentialId:
                  typeof cert === 'string' ? null : cert.credentialId || null,
                credentialUrl:
                  typeof cert === 'string' ? null : cert.credentialUrl || null,
                fileUrl: existing
                  ? existing.fileUrl
                  : typeof cert === 'string'
                    ? null
                    : cert.fileUrl || null,
                status: existing
                  ? existing.status
                  : typeof cert === 'string'
                    ? 'UNVERIFIED'
                    : cert.status || 'UNVERIFIED',
                adminFeedback: existing ? existing.adminFeedback : null,
              };
            }),
          });
        }
      }

      if (degrees && Array.isArray(degrees)) {
        const existingDegrees = await tx.degree.findMany({
          where: { candidateId },
        });

        // Find new ones
        const newDegs = degrees.filter((deg: any) => {
          const name = deg.name || deg.degree || '';
          const school = deg.school || '';
          return !existingDegrees.some(
            (ed) =>
              ed.name.toLowerCase() === name.toLowerCase() &&
              ed.school.toLowerCase() === school.toLowerCase(),
          );
        });
        newDegreesList = newDegs.map(
          (d: any) =>
            `${d.name || d.degree || 'Bằng cấp'} - ${d.school || 'Trường học'}`,
        );

        await tx.degree.deleteMany({ where: { candidateId } });
        if (degrees.length > 0) {
          await tx.degree.createMany({
            data: degrees.map((deg: any) => {
              const name = deg.name || deg.degree || 'Bằng cấp';
              const school = deg.school || 'Đại học';
              const existing = existingDegrees.find(
                (ed) =>
                  ed.name.toLowerCase() === name.toLowerCase() &&
                  ed.school.toLowerCase() === school.toLowerCase(),
              );
              return {
                candidateId,
                name,
                school,
                major: deg.major || null,
                issueDate: deg.issueDate || deg.duration || null,
                credentialId: deg.credentialId || null,
                fileUrl: existing ? existing.fileUrl : deg.fileUrl || null,
                status: existing ? existing.status : deg.status || 'UNVERIFIED',
                issuer: deg.issuer || null,
                adminFeedback: existing ? existing.adminFeedback : null,
              };
            }),
          });
        }
      }

      return updatedCandidate;
    });

    // Send notifications for new certs/degrees
    for (const certName of newCertsList) {
      try {
        await this.notificationsService.create(
          candidate.userId,
          'Phát hiện chứng chỉ mới',
          `Phát hiện chứng chỉ "${certName}" trong hồ sơ của bạn. Hãy tải lên tài liệu minh chứng để xác minh và tăng điểm uy tín!`,
          'info',
          '/profile',
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi tạo thông báo cho chứng chỉ ${certName}:`,
          err,
        );
      }
    }

    for (const degName of newDegreesList) {
      try {
        await this.notificationsService.create(
          candidate.userId,
          'Phát hiện bằng cấp mới',
          `Phát hiện bằng cấp "${degName}" trong hồ sơ của bạn. Hãy tải lên tài liệu minh chứng để xác minh và tăng điểm uy tín!`,
          'info',
          '/profile',
        );
      } catch (err) {
        this.logger.error(
          `Lỗi khi tạo thông báo cho bằng cấp ${degName}:`,
          err,
        );
      }
    }

    // Trigger matching engine to recalculate compatibility scores
    try {
      await this.matchingQueue.add('match-candidate', {
        userId: candidate.userId,
      });
      this.logger.log(
        `[CandidateManagement] Đã đẩy job match-candidate cho User: ${candidate.userId}`,
      );
    } catch (err) {
      this.logger.error(
        `[CandidateManagement] Lỗi khi đẩy job match-candidate:`,
        err,
      );
    }

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
            industries: true,
            languages: true,
            otherInfo: true,
            softSkills: true,
            interests: true,
            skills: true,
            experiences: { orderBy: { duration: 'desc' } },
            projects: true,
            certifications: true,
            degrees: true,
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
