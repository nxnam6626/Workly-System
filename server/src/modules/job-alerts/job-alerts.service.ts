import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JobAlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string): Promise<any[]> {
    return (this.prisma as any).jobAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, keywords: string): Promise<any> {
    const trimmedKeywords = keywords.trim().toLowerCase();
    
    // Check if alert with same keywords already exists for this user
    const existing = await (this.prisma as any).jobAlert.findFirst({
      where: {
        userId,
        keywords: {
          equals: trimmedKeywords,
          mode: 'insensitive',
        },
      },
    });

    if (existing) {
      throw new ConflictException('Bạn đã lưu từ khóa này rồi');
    }

    return (this.prisma as any).jobAlert.create({
      data: {
        userId,
        keywords: trimmedKeywords,
      },
    });
  }

  async remove(jobAlertId: string, userId: string): Promise<void> {
    const alert = await (this.prisma as any).jobAlert.findUnique({
      where: { jobAlertId },
    });

    if (!alert || alert.userId !== userId) {
      throw new NotFoundException('Không tìm thấy từ khóa đã lưu');
    }

    await (this.prisma as any).jobAlert.delete({
      where: { jobAlertId },
    });
  }
  
  async findAllAlerts(): Promise<any[]> {
    return (this.prisma as any).jobAlert.findMany();
  }
}
