import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { SupabaseService } from '../../../common/supabase/supabase.service';
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
  ) { }

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
    const fileUrl = await this.supabaseService.uploadFile(buffer, path, file.mimetype);

    const cvTitle = file.originalname.split('.')[0];
    return this.saveCv(userId, {
      cvTitle,
      fileUrl,
      isMain: true,
      parsedData: null,
      fileHash,
    });
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

    if (!cv.fileUrl) throw new BadRequestException('CV does not have a file URL');

    try {
      const path = this.supabaseService.extractPathFromUrl(cv.fileUrl);
      if (!path) throw new BadRequestException('Invalid file path in URL');

      const buffer = await this.supabaseService.downloadFile(path);
      let mimeType = 'application/pdf';
      const ext = extname(cv.fileUrl).toLowerCase();
      if (ext === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (ext === '.doc') mimeType = 'application/msword';

      const extractedData = await this.cvParsingService.parseCv(buffer, mimeType);
      if (!extractedData) throw new BadRequestException('Hệ thống AI không thể bóc tách dữ liệu từ CV này.');

      return this.updateCv(userId, cv.cvId, { parsedData: extractedData });
    } catch (error) {
      this.logger.error('Error analyzing CV:', error);
      throw error;
    }
  }

  async saveCv(userId: string, saveCvDto: any) {
    let candidate: any = await this.candidateProfileService.findByUserId(userId);
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
      select: { cvId: true, cvTitle: true, fileUrl: true, isMain: true, createdAt: true },
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
        where: { candidateId: candidate.candidateId, isMain: true, NOT: { cvId } },
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

    if (parsedData) {
      const candidateUpdateData: any = {};
      if (parsedData.fullName) candidateUpdateData.fullName = parsedData.fullName;
      if (parsedData.phone) candidateUpdateData.phone = parsedData.phone;
      if (parsedData.education && parsedData.education.length > 0) {
        candidateUpdateData.university = parsedData.education[0].school;
        candidateUpdateData.major = parsedData.education[0].major;
      }
      if (parsedData.gpa !== undefined) candidateUpdateData.gpa = parsedData.gpa;
      if (parsedData.skills && Array.isArray(parsedData.skills)) candidateUpdateData.skills = parsedData.skills;

      if (Object.keys(candidateUpdateData).length > 0) {
        try {
          await this.candidateProfileService.update(candidate.candidateId, candidateUpdateData);
        } catch (error) {
          this.logger.error('Lỗi khi đồng bộ dữ liệu vào hồ sơ ứng viên:', error);
        }
      }
    }

    if (isMain || parsedData) {
      await this.matchingQueue.add('match-candidate', { userId });
    }

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
