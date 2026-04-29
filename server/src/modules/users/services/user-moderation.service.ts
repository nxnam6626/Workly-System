import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MessagesGateway } from '../../messages/messages.gateway';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class UserModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleRef: ModuleRef,
  ) { }

  async lockUser(userId: string, reqUserId?: string) {
    if (userId === reqUserId) throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình.');
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    if (user.email === 'admin@workly.com') throw new BadRequestException('Không thể khóa tài khoản Quản trị viên tối cao.');

    await this.prisma.user.update({ where: { userId }, data: { status: 'LOCKED' } });

    try {
      const gateway = this.moduleRef.get(MessagesGateway, { strict: false });
      if (gateway) gateway.server.to(`user_${userId}`).emit('accountLocked');
    } catch (e) { }

    return { message: 'Tài khoản đã bị khóa.' };
  }

  async unlockUser(userId: string) {
    await this.resetViolationCount(userId);
    await this.prisma.user.update({ where: { userId }, data: { status: 'ACTIVE', accountLevel: 'NORMAL' } });
    return { message: 'Tài khoản đã được mở khóa và reset số lần vi phạm.' };
  }

  async unlockWithProbation(userId: string) {
    await this.resetViolationCount(userId);
    await this.prisma.user.update({ where: { userId }, data: { status: 'ACTIVE', accountLevel: 'PROBATION' } });
    return { message: 'Đã mở khóa tài khoản và đưa vào danh sách Thử thách (Reset vi phạm).' };
  }

  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    if (user.email === 'admin@workly.com') throw new BadRequestException('Không thể ban tài khoản Quản trị viên tối cao.');
    await this.prisma.user.update({ where: { userId }, data: { status: 'BANNED' } });
    return { message: 'Đã cấm vĩnh viễn tài khoản người dùng.' };
  }

  async resetViolationCount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { userId }, include: { recruiter: true } });
    if (!user) throw new NotFoundException('Không tìm thấy user.');
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { userId }, data: { violations: 0 } });
      if (user.recruiter) await tx.recruiter.update({ where: { userId }, data: { violationCount: 0 } });
    });
    return { message: 'Đã đặt lại toàn bộ số lần vi phạm về 0.' };
  }

  async updateAdminPermissions(userId: string, permissions: string[], fullName?: string) {
    const user = await this.prisma.user.findUnique({ where: { userId }, include: { admin: true } });
    if (!user || !user.admin) throw new NotFoundException('Người dùng này không phải là quản trị viên.');
    const isSupreme = permissions.includes('ALL') || permissions.includes('SUPER_ADMIN');
    await this.prisma.admin.update({
      where: { userId },
      data: { permissions: isSupreme ? ['SUPER_ADMIN'] : permissions, ...(fullName && { fullName }) },
    });
    return { message: 'Đã cập nhật quyền hạn quản trị viên.' };
  }
}
