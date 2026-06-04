import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SupabaseService } from '@/common/supabase/supabase.service';
import { CvParsingService } from '../cv-parsing.service';
import * as crypto from 'crypto';
import { extname } from 'path';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CandidateProfileService } from './candidate-profile.service';
import {
  AiExtractionService,
  DocumentVerificationResult,
} from '@/modules/intelligence/ai/services/ai-extraction.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';
import { syncCandidateLanguagesFromCertifications } from '@/modules/profiles/candidates/utils/language-sync';

@Injectable()
export class CandidateCvService {
  private readonly logger = new Logger(CandidateCvService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabaseService: SupabaseService,
    private readonly cvParsingService: CvParsingService,
    private readonly candidateProfileService: CandidateProfileService,
    private readonly aiExtractionService: AiExtractionService,
    private readonly notificationsService: NotificationsService,
    @InjectQueue('matching') private matchingQueue: Queue,
  ) { }

  /**
   * Evaluates AI result against thresholds and decides if document should be auto-rejected.
   *
   * Thresholds:
   * - is_valid = false        → Not a real document (selfie, random image, unreadable)
   * - confidence_score < 35   → Too uncertain to trust
   * - risk_level = 'high'     → AI flags as potentially fraudulent
   * - name_matches = false AND confidence < 60 → Clear name mismatch with enough certainty
   */
  private shouldAutoReject(ai: DocumentVerificationResult): boolean {
    if (!ai.is_valid) return true;
    if (ai.confidence_score < 35) return true;
    if (ai.risk_level === 'high') return true;
    if (!ai.name_matches && ai.confidence_score >= 60) return true;

    // Check if the document has expired
    if (ai.extracted_expiry_date) {
      const expiryDate = new Date(ai.extracted_expiry_date);
      if (!isNaN(expiryDate.getTime()) && expiryDate < new Date()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluates AI result against thresholds and decides if document should be auto-approved.
   *
   * Thresholds:
   * - is_valid = true         → Real document
   * - name_matches = true     → Document matches candidate's name (case-insensitive, accent-insensitive)
   * - risk_level = 'low'      → Minimal security concerns flagged
   * - confidence_score >= 90 (degree) or >= 80 (certification)
   */
  private shouldAutoApprove(
    ai: DocumentVerificationResult,
    docType: 'certification' | 'degree',
  ): boolean {
    if (!ai.is_valid) return false;
    if (!ai.name_matches) return false;
    if (ai.risk_level !== 'low') return false;

    const minThreshold = docType === 'degree' ? 90 : 80;
    return ai.confidence_score >= minThreshold;
  }

  async uploadCvOnly(userId: string, file: Express.Multer.File) {
    const buffer = file.buffer;
    const fileHash = crypto.createHash('md5').update(buffer).digest('hex');

    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (candidate) {
      const duplicate = await this.findByHash(candidate.candidateId, fileHash);
      if (duplicate) {
        throw new BadRequestException({
          message:
            'Tài liệu này đã tồn tại trong hệ thống của bạn. Vui lòng không tải trùng lặp.',
          errorCode: 'DUPLICATE_CV',
          cvId: duplicate.cvId,
        });
      }
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
      isMain: false,
      parsedData: null,
      fileHash,
    });
  }

  async extractAndAnalyzeCv(userId: string, file: Express.Multer.File) {
    try {
      this.logger.log(
        `[Flow] Bắt đầu quy trình bóc tách CV cho User: ${userId}`,
      );
      const buffer = file.buffer;
      const mimeType = file.mimetype;

      // 0. Gate 0: Chống trùng lặp hồ sơ (File Hash)
      const fileHash = crypto.createHash('md5').update(buffer).digest('hex');
      this.logger.log(
        `[Duplicate Check] Computed Hash: ${fileHash} for userId: ${userId}`,
      );

      const candidate = await this.candidateProfileService.findByUserId(userId);
      if (candidate) {
        this.logger.log(
          `[Duplicate Check] CandidateId: ${candidate.candidateId}. Querying DB...`,
        );
        const duplicate = await this.findByHash(
          candidate.candidateId,
          fileHash,
        );
        if (duplicate) {
          this.logger.warn(
            `[Duplicate Check] FOUND MATCHING CV: ${duplicate.cvId}. THROWING EXCEPTION NOW.`,
          );
          throw new BadRequestException({
            message:
              'Tài liệu này đã tồn tại trong hệ thống của bạn. Vui lòng không tải trùng lặp.',
            errorCode: 'DUPLICATE_CV',
            cvId: duplicate.cvId,
          });
        } else {
          this.logger.log(
            `[Duplicate Check] No duplicate found in database for hash: ${fileHash}`,
          );
        }
      } else {
        this.logger.log(
          `[Duplicate Check] Candidate profile not found for userId: ${userId}`,
        );
      }

      // 1. Gate 1: Bóc tách văn bản & Sanity Check
      const rawText = await this.cvParsingService.extractTextLocal(
        buffer,
        mimeType,
      );
      const sanityCheck = this.cvParsingService.validateIsCv(rawText);
      if (!sanityCheck.isValid) {
        throw new BadRequestException(
          sanityCheck.reason || 'Không thể bóc tách văn bản từ tệp này.',
        );
      }

      // 2. Tạm thời tải lên Supabase để lấy FileUrl (Phục vụ hiển thị Preview nếu cần)
      this.logger.log('[Flow] Gate 1 Pass. Lưu tạm thời hồ sơ...');
      const cv = await this.uploadCvOnly(userId, file);

      try {
        // 3. Gate 2: AI Parsing (All-in-One)
        this.logger.log('[Flow] Đang gọi AI xử lý (Gate 2)...');
        const extractedData =
          await this.cvParsingService.parseCvFromText(rawText);

        if (!extractedData) {
          throw new BadRequestException(
            'AI không thể xử lý dữ liệu từ tệp này.',
          );
        }

        // 4. Gate 3: Schema Validation & Rollback
        const schemaCheck =
          this.cvParsingService.validateParsedData(extractedData);
        if (!schemaCheck.isValid) {
          this.logger.warn('[Flow] Gate 3 Fail. Dữ liệu không đạt chuẩn.');
          await this.rollbackCvUpload(cv.cvId, cv.fileUrl);

          throw new BadRequestException({
            message:
              schemaCheck.errorReason || 'Hồ sơ thiếu thông tin quan trọng.',
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
    } catch (error: any) {
      if (
        error instanceof HttpException ||
        (error.status && typeof error.status === 'number')
      ) {
        throw error;
      }
      this.logger.error(
        `[Flow] Unhandled error during CV extraction for user ${userId}:`,
        error,
      );
      throw new BadRequestException(
        error.message ||
        'Có lỗi xảy ra khi xử lý tệp CV của bạn. Vui lòng thử lại với tệp khác.',
      );
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

  async verifyCertification(
    userId: string,
    certificationId: string,
    file: Express.Multer.File,
  ) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const cert = await this.prisma.certification.findUnique({
      where: { certificationId },
    });
    if (!cert || cert.candidateId !== candidate.candidateId) {
      throw new NotFoundException(
        'Certification not found or does not belong to you',
      );
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `cert-${certificationId}-${uniqueSuffix}${extname(file.originalname)}`;
    const path = `${userId}/verifications/${fileName}`;
    const fileUrl = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    const updated = await this.prisma.certification.update({
      where: { certificationId },
      data: {
        fileUrl,
        status: 'PENDING',
      },
    });

    // Run AI verification in the background asynchronously
    this.runAsyncCertificationVerification(
      userId,
      certificationId,
      file.buffer,
      file.mimetype,
      candidate.fullName,
      cert,
    );

    return updated;
  }

  async verifyDegree(
    userId: string,
    degreeId: string,
    file: Express.Multer.File,
  ) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate profile not found');

    const deg = await this.prisma.degree.findUnique({
      where: { degreeId },
    });
    if (!deg || deg.candidateId !== candidate.candidateId) {
      throw new NotFoundException('Degree not found or does not belong to you');
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileName = `degree-${degreeId}-${uniqueSuffix}${extname(file.originalname)}`;
    const path = `${userId}/verifications/${fileName}`;
    const fileUrl = await this.supabaseService.uploadFile(
      file.buffer,
      path,
      file.mimetype,
    );

    const updated = await this.prisma.degree.update({
      where: { degreeId },
      data: {
        fileUrl,
        status: 'PENDING',
      },
    });

    // Run AI verification in the background asynchronously
    this.runAsyncDegreeVerification(
      userId,
      degreeId,
      file.buffer,
      file.mimetype,
      candidate.fullName,
      deg,
    );

    return updated;
  }

  async runAsyncCertificationVerification(
    userId: string,
    certificationId: string,
    buffer: Buffer,
    mimetype: string,
    fullName: string,
    cert: any,
  ) {
    try {
      let aiVerification: DocumentVerificationResult | null = null;
      try {
        aiVerification = await this.aiExtractionService.verifyDocument(
          buffer,
          mimetype,
          fullName,
          'certification',
        );
      } catch (err) {
        this.logger.error(
          `AI Certification verification error: ${err.message}`,
        );
      }

      // Determine status: auto-reject or auto-approve based on AI results
      const autoReject = aiVerification
        ? this.shouldAutoReject(aiVerification)
        : false;
      const autoApprove =
        !autoReject && aiVerification
          ? this.shouldAutoApprove(aiVerification, 'certification')
          : false;
      const finalStatus = autoReject
        ? 'REJECTED'
        : autoApprove
          ? 'VERIFIED'
          : 'PENDING';

      let adminFeedback: string | undefined = undefined;
      if (autoReject) {
        const isExpired =
          aiVerification?.extracted_expiry_date &&
          !isNaN(new Date(aiVerification.extracted_expiry_date).getTime()) &&
          new Date(aiVerification.extracted_expiry_date) < new Date();

        if (isExpired) {
          adminFeedback = `[AI Tự động từ chối] Tài liệu minh chứng đã hết hạn hiệu lực (hết hạn vào ngày ${new Date(aiVerification!.extracted_expiry_date!).toLocaleDateString('vi-VN')}). Vui lòng tải lên tài liệu mới.`;
        } else {
          adminFeedback = `[AI Tự động từ chối] ${aiVerification?.reason ?? 'Tài liệu không đạt tiêu chí xác minh.'}`;
        }
        this.logger.warn(
          `[AutoReject] Certification ${certificationId} auto-rejected — score=${aiVerification?.confidence_score}, risk=${aiVerification?.risk_level}, valid=${aiVerification?.is_valid}`,
        );
      } else if (autoApprove) {
        adminFeedback = `[AI Tự động duyệt] ${aiVerification?.reason ?? 'Tài liệu hợp lệ và khớp thông tin.'}`;
        this.logger.log(
          `[AutoApprove] Certification ${certificationId} auto-approved — score=${aiVerification?.confidence_score}, risk=${aiVerification?.risk_level}`,
        );
      }

      await this.prisma.certification.update({
        where: { certificationId },
        data: {
          status: finalStatus,
          adminFeedback,
          aiVerification: (aiVerification as any) || undefined,
          ...(aiVerification?.extracted_issue_date && {
            issueDate: aiVerification.extracted_issue_date,
          }),
          ...(aiVerification?.extracted_major && {
            name: aiVerification.extracted_major,
          }),
          ...(aiVerification?.extracted_credential_id && {
            credentialId: aiVerification.extracted_credential_id,
          }),
          ...(aiVerification?.extracted_institution && {
            issuer: aiVerification.extracted_institution,
          }),
        },
      });

      if (finalStatus === 'VERIFIED') {
        try {
          await syncCandidateLanguagesFromCertifications(
            cert.candidateId,
            this.prisma,
          );
        } catch (err) {
          this.logger.error(
            `Error syncing languages from auto-approved certification: ${err.message}`,
          );
        }
      }

      // Trigger matching engine since status changed
      await this.matchingQueue.add('match-candidate', { userId });

      // Notify candidate of status change
      if (autoReject) {
        await this.notificationsService.create(
          userId,
          'Minh chứng chứng chỉ bị từ chối tự động',
          `Tài liệu bạn nộp cho chứng chỉ "${cert.name}" không đạt tiêu chí xác minh. ` +
          `Lý do: ${aiVerification?.reason ?? 'Không xác định được'}. ` +
          `Vui lòng nộp lại ảnh/PDF rõ nét, đúng văn bản gốc có dấu đỏ và chữ ký.`,
          'error',
          '/profile/certifications',
        );
        this.notificationsService.emitToUser(userId, 'notification', {
          title: 'Minh chứng bị từ chối',
          message: `Chứng chỉ "${cert.name}" — ${aiVerification?.reason?.slice(0, 80) ?? ''}...`,
        });
      } else if (autoApprove) {
        await this.notificationsService.create(
          userId,
          'Minh chứng chứng chỉ được duyệt tự động',
          `Tài liệu bạn nộp cho chứng chỉ "${cert.name}" đã được hệ thống tự động xác thực thành công.`,
          'success',
          '/profile/certifications',
        );
        this.notificationsService.emitToUser(userId, 'notification', {
          title: 'Minh chứng đã được duyệt',
          message: `Chứng chỉ "${cert.name}" đã được xác thực tự động thành công.`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed running async certification verification: ${error.message}`,
      );
    }
  }

  async runAsyncDegreeVerification(
    userId: string,
    degreeId: string,
    buffer: Buffer,
    mimetype: string,
    fullName: string,
    deg: any,
  ) {
    try {
      let aiVerification: DocumentVerificationResult | null = null;
      try {
        aiVerification = await this.aiExtractionService.verifyDocument(
          buffer,
          mimetype,
          fullName,
          'degree',
        );
      } catch (err) {
        this.logger.error(`AI Degree verification error: ${err.message}`);
      }

      const autoReject = aiVerification
        ? this.shouldAutoReject(aiVerification)
        : false;
      const autoApprove =
        !autoReject && aiVerification
          ? this.shouldAutoApprove(aiVerification, 'degree')
          : false;
      const finalStatus = autoReject
        ? 'REJECTED'
        : autoApprove
          ? 'VERIFIED'
          : 'PENDING';

      let adminFeedback: string | undefined = undefined;
      if (autoReject) {
        adminFeedback = `[AI Tự động từ chối] ${aiVerification?.reason ?? 'Tài liệu không đạt tiêu chí xác minh.'}`;
        this.logger.warn(
          `[AutoReject] Degree ${degreeId} auto-rejected — score=${aiVerification?.confidence_score}, risk=${aiVerification?.risk_level}, valid=${aiVerification?.is_valid}`,
        );
      } else if (autoApprove) {
        adminFeedback = `[AI Tự động duyệt] ${aiVerification?.reason ?? 'Tài liệu hợp lệ và khớp thông tin.'}`;
        this.logger.log(
          `[AutoApprove] Degree ${degreeId} auto-approved — score=${aiVerification?.confidence_score}, risk=${aiVerification?.risk_level}`,
        );
      }

      await this.prisma.degree.update({
        where: { degreeId },
        data: {
          status: finalStatus,
          adminFeedback,
          aiVerification: (aiVerification as any) || undefined,
          ...(aiVerification?.extracted_issue_date && {
            issueDate: aiVerification.extracted_issue_date,
          }),
          ...(aiVerification?.extracted_major && {
            major: aiVerification.extracted_major,
          }),
          ...(aiVerification?.extracted_credential_id && {
            credentialId: aiVerification.extracted_credential_id,
          }),
          ...(aiVerification?.extracted_institution && {
            school: aiVerification.extracted_institution,
          }),
        },
      });

      // Automatically sync degree to candidate profile if candidate has only 1 degree
      // or if their university/major fields are currently empty
      try {
        const candidate = await this.prisma.candidate.findUnique({
          where: { candidateId: deg.candidateId },
          include: { degrees: true },
        });

        if (
          candidate &&
          (candidate.degrees.length === 1 ||
            !candidate.university ||
            !candidate.major)
        ) {
          const universityToSet =
            aiVerification?.extracted_institution || deg.school || undefined;
          const majorToSet =
            aiVerification?.extracted_major || deg.major || undefined;

          let gpaFloat: number | undefined = undefined;
          const gradeStr = aiVerification?.extracted_grade || '';
          const gpaMatch =
            gradeStr.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/) ||
            gradeStr.match(/(\d+(?:\.\d+)?)/);
          if (gpaMatch) {
            const value = parseFloat(gpaMatch[1]);
            const base = gpaMatch[2] ? parseFloat(gpaMatch[2]) : 4.0;
            if (base === 10 || value > 4.0) {
              if (value <= 10) {
                gpaFloat = parseFloat(((value / base) * 4.0).toFixed(2));
              }
            } else if (value >= 0 && value <= 4.0) {
              gpaFloat = value;
            }
          }

          await this.prisma.candidate.update({
            where: { candidateId: deg.candidateId },
            data: {
              ...(universityToSet && { university: universityToSet }),
              ...(majorToSet && { major: majorToSet }),
              ...(gpaFloat !== undefined && { gpa: gpaFloat }),
            },
          });

          this.logger.log(
            `[Degree Verification Sync] Auto-updated candidate profile for candidate: ${deg.candidateId}`,
          );
        }
      } catch (syncErr) {
        this.logger.error(
          `[Degree Verification Sync] Auto-update failed: ${syncErr.message}`,
        );
      }

      // Trigger matching engine since status changed (e.g. from PENDING to VERIFIED/REJECTED)
      await this.matchingQueue.add('match-candidate', { userId });

      // Notify candidate of status change
      if (autoReject) {
        await this.notificationsService.create(
          userId,
          'Minh chứng bằng cấp bị từ chối tự động',
          `Tài liệu bạn nộp cho bằng "${deg.name}" không đạt tiêu chí xác minh. ` +
          `Lý do: ${aiVerification?.reason ?? 'Không xác định được'}. ` +
          `Vui lòng nộp lại ảnh/PDF rõ nét, đúng văn bản gốc có dấu đỏ và chữ ký.`,
          'error',
          '/profile/degrees',
        );
        this.notificationsService.emitToUser(userId, 'notification', {
          title: 'Minh chứng bị từ chối',
          message: `Bằng "${deg.name}" — ${aiVerification?.reason?.slice(0, 80) ?? ''}...`,
        });
      } else if (autoApprove) {
        await this.notificationsService.create(
          userId,
          'Minh chứng bằng cấp được duyệt tự động',
          `Tài liệu bạn nộp cho bằng "${deg.name}" đã được hệ thống tự động xác thực thành công.`,
          'success',
          '/profile/degrees',
        );
        this.notificationsService.emitToUser(userId, 'notification', {
          title: 'Minh chứng đã được duyệt',
          message: `Bằng "${deg.name}" đã được xác thực tự động thành công.`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed running async degree verification: ${error.message}`,
      );
    }
  }

  async syncDegreeToProfile(userId: string, degreeId: string) {
    const candidate = await this.candidateProfileService.findByUserId(userId);
    if (!candidate) throw new NotFoundException('Candidate not found');

    const deg = await this.prisma.degree.findUnique({
      where: { degreeId },
    });
    if (!deg || deg.candidateId !== candidate.candidateId) {
      throw new NotFoundException('Degree not found or does not belong to you');
    }

    const aiVerification = deg.aiVerification as any;
    const universityToSet = aiVerification?.extracted_institution || deg.school || undefined;
    const majorToSet = aiVerification?.extracted_major || deg.major || undefined;

    let gpaFloat: number | undefined = undefined;
    const gradeStr = aiVerification?.extracted_grade || '';
    const gpaMatch =
      gradeStr.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/) ||
      gradeStr.match(/(\d+(?:\.\d+)?)/);
    if (gpaMatch) {
      const value = parseFloat(gpaMatch[1]);
      const base = gpaMatch[2] ? parseFloat(gpaMatch[2]) : 4.0;
      if (base === 10 || value > 4.0) {
        if (value <= 10) {
          gpaFloat = parseFloat(((value / base) * 4.0).toFixed(2));
        }
      } else if (value >= 0 && value <= 4.0) {
        gpaFloat = value;
      }
    }

    await this.prisma.candidate.update({
      where: { candidateId: candidate.candidateId },
      data: {
        ...(universityToSet && { university: universityToSet }),
        ...(majorToSet && { major: majorToSet }),
        ...(gpaFloat !== undefined && { gpa: gpaFloat }),
      },
    });

    // Trigger matching engine
    await this.matchingQueue.add('match-candidate', { userId });

    return this.prisma.user.findUnique({
      where: { userId },
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
}
