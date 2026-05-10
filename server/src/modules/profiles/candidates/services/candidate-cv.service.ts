import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase/supabase.service';
import { CvParsingService } from '../cv-parsing.service';
import * as crypto from 'crypto';
import { extname } from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CandidateProfileService } from './candidate-profile.service';

@Injectable()
export class CandidateCvService {
  private readonly logger = new Logger(CandidateCvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly cvParsingService: CvParsingService,
    private readonly candidateProfileService: CandidateProfileService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) {}

  async uploadCvOnly(userId: string, file: Express.Multer.File) {
    const buffer = file.buffer;
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (candidate) {
      const duplicate = await this.findByHash(candidate.candidateId, fileHash);
      if (duplicate) return duplicate;
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `cv-extract-${uniqueSuffix}${extname(file.originalname)}`;
    const path = `${userId}/${fileName}`;
    const fileUrl = await this.supabaseService.uploadFile(
      buffer,
      path,
      file.mimetype,
    );

    const cvTitle = file.originalname.split('.')[0];
    return this.saveCv(userId, {
      cvTitle,
      fileUrl,
      isMain: true,
      parsedData: null,
      fileHash,
    });
  }

  async extractAndAnalyzeCv(userId: string, file: Express.Multer.File) {
    this.logger.log(`[Flow] Bắt đầu quy trình bóc tách CV cho User: ${userId}`);
    const buffer = file.buffer;
    const mimeType = file.mimetype;

    // 1. Gate 1: Bóc tách văn bản & Sanity Check
    const rawText = await this.cvParsingService.extractTextLocal(buffer, mimeType);
    const sanityCheck = this.cvParsingService.validateIsCv(rawText);
    if (!sanityCheck.isValid) {
      throw new BadRequestException(sanityCheck.reason || 'Không thể bóc tách văn bản từ tệp này.');
    }

    // 2. Tạm thời tải lên Supabase để lấy FileUrl (Phục vụ hiển thị Preview nếu cần)
    this.logger.log('[Flow] Gate 1 Pass. Lưu tạm thời hồ sơ...');
    const cv = await this.uploadCvOnly(userId, file);

    try {
      // 3. Gate 2: AI Parsing (All-in-One)
      this.logger.log('[Flow] Đang gọi AI xử lý (Gate 2)...');
      const extractedData = await this.cvParsingService.parseCvFromText(rawText);

      if (!extractedData) {
        throw new BadRequestException('AI không thể xử lý dữ liệu từ tệp này.');
      }

      // 4. Gate 3: Schema Validation & Rollback
      const schemaCheck = this.cvParsingService.validateParsedData(extractedData);
      if (!schemaCheck.isValid) {
        this.logger.warn('[Flow] Gate 3 Fail. Dữ liệu không đạt chuẩn.');
        await this.rollbackCvUpload(cv.cvId, cv.fileUrl);

        throw new BadRequestException({
          message: schemaCheck.errorReason || 'Hồ sơ thiếu thông tin quan trọng.',
          missingFields: schemaCheck.missingFields,
          error: 'CV_INCOMPLETE',
        });
      }

      // 5. Thành công: Cập nhật DB
      this.logger.log('✅ [Flow] Gate 3 Pass. Hoàn tất quy trình.');
      const result = await this.updateCv(userId, cv.cvId, {
        parsedData: extractedData,
      });
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      this.logger.error('[Flow] Lỗi nghiêm trọng trong quy trình:', error);
      return cv;
    }
  }

  /**
   * Hoàn tác việc tải lên CV nếu phát hiện không hợp lệ
   */
  private async rollbackCvUpload(cvId: string, fileUrl: string | null) {
    if (!fileUrl) {
      await this.prisma.cV.delete({ where: { cvId } });
      return;
    }

    this.logger.log(`[Flow] Thực hiện Rollback: Xóa file ${fileUrl}`);
    try {
      const path = this.supabaseService.extractPathFromUrl(fileUrl);
      if (path) {
        await this.supabaseService.deleteFile(path);
      }
      await this.prisma.cV.delete({ where: { cvId } });
    } catch (err) {
      this.logger.error('[Flow] Lỗi khi thực hiện Rollback:', err);
    }
  }

  async analyzeCv(userId: string, cvId: string) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
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
      const path = this.supabaseService.extractPathFromUrl(cv.fileUrl);
      if (!path) throw new BadRequestException('Invalid file path in URL');

      const buffer = await this.supabaseService.downloadFile(path);
      let mimeType = 'application/pdf';
      const ext = extname(cv.fileUrl).toLowerCase();
      if (ext === '.docx')
        mimeType =
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === '.doc') mimeType = 'application/msword';

      const extractedData = await this.cvParsingService.parseCv(
        buffer,
        mimeType,
      );
      if (!extractedData)
        throw new BadRequestException(
          'Hệ thống AI không thể bóc tách dữ liệu từ CV này.',
        );

      // Thêm kiểm tra chất lượng ở đây nếu muốn đồng bộ
      const qualityCheck =
        this.cvParsingService.validateParsedData(extractedData);
      if (!qualityCheck.isValid) {
        throw new BadRequestException({
          message: 'CV thiếu thông tin quan trọng để tham gia tuyển dụng.',
          missingFields: qualityCheck.missingFields,
          error: 'CV_INCOMPLETE',
        });
      }

      return this.updateCv(userId, cv.cvId, { parsedData: extractedData });
    } catch (error: any) {
      const msg = error.response?.message || error.message;
      if (
        msg === 'NOT_A_CV' ||
        msg.includes('thông tin liên hệ') ||
        msg.includes('nội dung đặc trưng')
      ) {
        throw new BadRequestException(msg);
      }
      this.logger.error('Error analyzing CV:', error);
      throw error;
    }
  }

  async saveCv(userId: string, saveCvDto: any) {
    let candidate: any =
      await this.candidateProfileService.findByUserId(userId);
    if (!candidate) {
      const user = await this.prisma.user.findUnique({ where: { userId } });
      if (!user) throw new NotFoundException('User not found');
      candidate = await this.prisma.candidate.create({
        data: { userId, fullName: user.email.split('@')[0] },
      });
    }

    const { cvTitle, fileUrl, isMain, parsedData, fileHash } = saveCvDto;
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
        fileHash,
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
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate not found');

    const cv = await this.prisma.cV.findUnique({ where: { cvId } });
    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    const { cvTitle, fileUrl, isMain, parsedData } = updateCvDto;
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

    return updatedCv;
  }

  async setMainCv(userId: string, cvId: string) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate not found');

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, candidateId: true },
    });
    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.cV.updateMany({
        where: { candidateId: candidate.candidateId, isMain: true },
        data: { isMain: false },
      });
      return tx.cV.update({
        where: { cvId },
        data: { isMain: true },
      });
    });

    await this.matchingQueue.add('match-candidate', { userId });
    return result;
  }

  async deleteCv(userId: string, cvId: string) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate not found');

    const cv = await this.prisma.cV.findUnique({
      where: { cvId },
      select: { cvId: true, candidateId: true, fileUrl: true, isMain: true },
    });

    if (!cv || cv.candidateId !== candidate.candidateId) {
      throw new NotFoundException('CV not found or does not belong to user');
    }

    if (cv.isMain) {
      const otherCv = await this.prisma.cV.findFirst({
        where: { candidateId: candidate.candidateId, NOT: { cvId } },
        orderBy: { createdAt: 'desc' },
      });

      if (otherCv) {
        await this.prisma.cV.update({
          where: { cvId: otherCv.cvId },
          data: { isMain: true },
        });
        await this.matchingQueue.add('match-candidate', { userId });
      }
    }

    if (cv.fileUrl) {
      const path = this.supabaseService.extractPathFromUrl(cv.fileUrl);
      if (path) {
        try {
          await this.supabaseService.deleteFile(path);
        } catch (e) {
          this.logger.error(`Failed to delete file from Supabase: ${path}`, e);
        }
      }
    }

    return this.prisma.cV.delete({ where: { cvId } });
  }
}
