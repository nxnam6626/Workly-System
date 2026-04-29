import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';
import { TransactionType } from '@prisma/client';

@Injectable()
export class UnlockService {
  private readonly logger = new Logger(UnlockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService,
  ) { }

  async getWallet(userId: string) {
    // Return Wallet through WalletsService instead of RecruiterWallet
    return this.walletsService.getBalance(userId);
  }

  async unlockCandidate(
    userId: string,
    candidateId: string,
    jobPostingId: string,
    cvId: string,
  ) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter)
      throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');

    // Kiểm tra xem đã mở khóa chưa cho Job này
    const existingUnlock = await this.prisma.candidateUnlock.findUnique({
      where: {
        recruiterId_candidateId_jobPostingId: {
          recruiterId: recruiter.recruiterId,
          candidateId,
          jobPostingId,
        },
      },
    });

    if (existingUnlock) {
      return {
        message: 'Ứng viên này đã được mở khóa cho vị trí này.',
        status: 'ALREADY_UNLOCKED',
      };
    }

    // Lấy wallet và tự động xử lý giá mở khóa (0 xu nếu có Quota, 30 xu có subs, 50 xu không subs)
    let finalCost = 0;
    try {
      const result = await this.walletsService.deductCvUnlock(
        recruiter.recruiterId,
        `Mở khóa ứng viên #${candidateId.slice(0, 8)} cho job #${jobPostingId.slice(0, 8)}`,
      );
      finalCost = result.cost;
    } catch (error) {
      this.logger.error('Unlock deduct error', error);
      throw error; // BadRequestException bubbles up
    }

    // Tạo bản ghi Unlock
    const unlock = await this.prisma.candidateUnlock.create({
      data: {
        recruiterId: recruiter.recruiterId,
        candidateId,
        jobPostingId,
        cvId,
        creditSpent: finalCost,
      },
    });

    // Đồng bộ mở khóa cho Application (nếu có)
    await this.prisma.application.updateMany({
      where: { candidateId, jobPostingId },
      data: { isUnlocked: true },
    });

    return unlock;
  }

  async getUnlockedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    return this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
    });
  }
}
