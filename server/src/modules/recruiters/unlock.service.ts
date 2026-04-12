import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UnlockService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { wallet: true },
    });

    if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');

    // Nếu chưa có ví, tạo mới (mặc định 0 credit hoặc tặng 5 credit dùng thử)
    if (!recruiter.wallet) {
      return this.prisma.recruiterWallet.create({
        data: {
          recruiterId: recruiter.recruiterId,
          balance: 5, // Tặng 5 credit dùng thử
        },
      });
    }

    return recruiter.wallet;
  }

  async unlockCandidate(userId: string, candidateId: string, jobPostingId: string, cvId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
      include: { wallet: true },
    });

    if (!recruiter) throw new NotFoundException('Không tìm thấy nhà tuyển dụng.');
    if (!recruiter.wallet || recruiter.wallet.balance < 1) {
      throw new BadRequestException('Số dư Credit không đủ. Vui lòng nạp thêm.');
    }

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

    // Thực hiện trừ tiền và lưu lịch sử (Transaction)
    return this.prisma.$transaction(async (tx) => {
      // 1. Trừ 1 Credit
      await tx.recruiterWallet.update({
        where: { recruiterId: recruiter.recruiterId },
        data: { balance: { decrement: 1 } },
      });

      // 2. Tạo bản ghi Unlock
      const unlock = await tx.candidateUnlock.create({
        data: {
          recruiterId: recruiter.recruiterId,
          candidateId,
          jobPostingId,
          cvId,
          creditSpent: 1,
        },
      });

      return unlock;
    });
  }

  async getUnlockedCandidates(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) throw new NotFoundException('Recruiter not found');

    return this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
    });
  }
}
