import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { AiService } from '../../../ai/ai.service';
import { EVASION_REGEX } from '../../../ai/ai-moderation.service';
import { CreateJobPostingDto } from '../dto/create-job-posting.dto';

@Injectable()
export class JobModerationService {
  private readonly logger = new Logger(JobModerationService.name);
  private readonly VIOLATION_LIMIT = 3;

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) { }

  validateBlacklist(...fields: (string | string[] | undefined)[]) {
    const BLACKLIST = [
      'sex', 'cờ bạc', 'ma túy', 'đa cấp', 'lừa đảo', 'phản động',
      'zalo', 'sđt', '0[0-9]{9}', 'http', 'https', 'facebook', 'fb.com',
      'telegram', 'cv xin việc', 'tuyển gấp', 'thu nhập khủng',
    ];

    let containsBadWords = false;
    const foundWords: string[] = [];

    const checkText = (text: string) => {
      if (!text) return;
      const normalizedText = text.toLowerCase();
      // Use EVASION_REGEX to detect hidden contact info
      if (EVASION_REGEX.test(normalizedText)) {
        containsBadWords = true;
        foundWords.push('Thông tin liên hệ/Mạng xã hội (Evasion)');
      }

      for (const word of BLACKLIST) {
        const regex = new RegExp(word, 'gi');
        if (regex.test(normalizedText)) {
          containsBadWords = true;
          foundWords.push(word);
        }
      }
    };

    fields.forEach(field => {
      if (Array.isArray(field)) {
        field.forEach(item => checkText(item));
      } else if (typeof field === 'string') {
        checkText(field);
      }
    });

    return { containsBadWords, foundWords: [...new Set(foundWords)] };
  }

  async moderateJobContent(
    title: string,
    description: string,
    requirements: string,
    benefits: string,
    hardSkills: string[],
    jobTier: string = 'BASIC'
  ) {
    return this.aiService.moderateJobContent(
      title,
      description,
      requirements,
      benefits,
      hardSkills,
      jobTier
    );
  }

  async checkAndAutoLockRecruiter(recruiterId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { recruiterId },
      include: { user: true },
    });

    if (!recruiter) return;

    const newViolations = (recruiter.violationCount || 0) + 1;
    await this.prisma.recruiter.update({
      where: { recruiterId },
      data: { violationCount: newViolations },
    });

    if (newViolations >= this.VIOLATION_LIMIT) {
      await this.prisma.user.update({
        where: { userId: recruiter.userId },
        data: { status: 'LOCKED' },
      });
      this.logger.warn(`Recruiter ${recruiterId} auto-locked due to ${newViolations} violations.`);
    }
  }

  async preCheck(dto: CreateJobPostingDto) {
    const { containsBadWords, foundWords } = this.validateBlacklist(
      dto.title,
      dto.description,
      dto.requirements,
      dto.benefits,
      dto.hardSkills as string[],
      dto.softSkills as string[],
    );

    if (containsBadWords) {
      return {
        score: 40,
        safe: false,
        reason: 'Nội dung chứa từ khóa bị cấm.',
        flags: foundWords,
        feedback: ['Vui lòng loại bỏ các từ ngữ không phù hợp hoặc thông tin liên hệ cá nhân (số điện thoại, link mạng xã hội) khỏi mô tả.'],
        usedAI: false,
      };
    }

    const modResult = await this.moderateJobContent(
      dto.title,
      dto.description || '',
      dto.requirements || '',
      dto.benefits || '',
      dto.hardSkills as string[] || [],
      dto.jobTier || 'BASIC'
    );

    return {
      ...modResult,
      suggestedAction: modResult.score < 70 ? 'Sửa lại JD để được duyệt tự động, hoặc gửi Admin duyệt thủ công.' : 'JD đạt chuẩn, có thể đăng ngay.',
    };
  }
}
