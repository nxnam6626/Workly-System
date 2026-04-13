import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesGateway } from '../messages/messages.gateway';

@Injectable()
export class SupportService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
  ) {}

  async createSupportRequest(dto: CreateSupportDto, userId?: string) {
    let resolvedUserId = userId;

    if (!resolvedUserId && dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
        select: { userId: true },
      });
      if (existingUser) {
        resolvedUserId = existingUser.userId;
      }
    }

    const request = await this.prisma.supportRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        subject: dto.subject,
        message: dto.message,
        userId: resolvedUserId || null,
      },
    });

    // Notify ALL admins
    const admins = await this.prisma.user.findMany({
      where: {
        userRoles: { some: { role: { roleName: 'ADMIN' } } },
      },
    });

    for (const admin of admins) {
      const title = 'Yêu cầu hỗ trợ mới';
      const msg = `Có yêu cầu hỗ trợ mới từ ${dto.email}: "${dto.subject}"`;
      await this.notificationsService.create(admin.userId, title, msg, 'info', '/admin/support');
      this.messagesGateway.server.to(`user_${admin.userId}`).emit('notification', {
        title,
        message: msg,
        type: 'info',
        link: '/admin/support',
      });
    }

    return request;
  }

  async getAllRequests() {
    return this.prisma.supportRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            userId: true,
            email: true,
            status: true,
            userRoles: { select: { role: true } },
          },
        },
      },
    });
  }

  async updateStatus(requestId: string, status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') {
    return this.prisma.supportRequest.update({
      where: { requestId },
      data: { status, updatedAt: new Date() },
    });
  }
}
