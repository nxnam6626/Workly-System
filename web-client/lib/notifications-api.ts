import api from './api';

export interface Notification {
  notificationId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: any;
}

export const notificationsApi = {
  getNotifications: (): Promise<Notification[]> =>
    api.get('/notifications').then((r) => r.data),

  getUnreadCount: (): Promise<{ unreadCount: number }> =>
    api.get('/notifications/unread-count').then((r) => r.data),

  markAsRead: (id: string): Promise<any> =>
    api.patch(`/notifications/read/${id}`).then((r) => r.data),

  markAllAsRead: (): Promise<any> =>
    api.patch('/notifications/read-all').then((r) => r.data),
};
