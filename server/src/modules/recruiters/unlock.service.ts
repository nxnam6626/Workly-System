import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class UnlockService {
  private readonly logger = new Logger(UnlockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletsService: WalletsService
  ) {}

  async getWallet(userId: string) {
    // Return Wallet through WalletsService instead of RecruiterWallet
    return this.walletsService.getBalance(userId);
  }

  async unlockCandidate(userId: string, candidateId: string, jobPostingId: string, cvId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');

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
      return { message: 'Ứng viên này đã được mở khóa cho vị trí này.', status: 'ALREADY_UNLOCKED' };
    }

    const unLockCost = 50;

    // Lấy wallet và tự động văng lỗi nếu balance < unLockCost
    try {
      await this.walletsService.deduct(recruiter.recruiterId, unLockCost, `Mở khóa ứng viên #${candidateId.slice(0, 8)} cho job #${jobPostingId.slice(0, 8)}`);
    } catch(error) {
       this.logger.error("Unlock deduct error", error);
       throw new BadRequestException('Số dư xu không đủ (Cần 50 xu). Vui lòng nạp thêm.');
    }

    // Tạo bản ghi Unlock
    const unlock = await this.prisma.candidateUnlock.create({
      data: {
        recruiterId: recruiter.recruiterId,
        candidateId,
        jobPostingId,
        cvId,
        creditSpent: unLockCost,
      },
    });

    return unlock;
  }

  async getUnlockedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    return this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
    });
  }
}
