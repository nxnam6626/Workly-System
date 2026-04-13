import { Controller, Get, UseGuards, Patch, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser('userId') userId: string) {
    return this.notificationsService.findAllForUser(userId);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser('userId') userId: string) {
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount };
  }

  @Patch('read/:id')
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }
}
