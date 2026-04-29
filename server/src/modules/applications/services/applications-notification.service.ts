import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MessagesGateway } from '../../messages/messages.gateway';

@Injectable()
export class ApplicationsNotificationService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private messagesGateway: MessagesGateway,
  ) { }

  async notifyRecruiterOfNewApplication(application: any) {
    if (!application.jobPosting.recruiter?.userId) return;

    const recruiterId = application.jobPosting.recruiter.userId;
    const title = 'Hồ sơ ứng viên mới';
    const message = `Ứng viên ${application.candidate.fullName} vừa nộp hồ sơ cho vị trí "${application.jobPosting.title}".`;

    await this.notificationsService.create(
      recruiterId,
      title,
      message,
      'info',
      '/recruiter/applications',
    );

    this.messagesGateway.server
      .to(`user_${recruiterId}`)
      .emit('notification', {
        title,
        message,
        type: 'info',
        link: '/recruiter/applications',
      });

    this.messagesGateway.server
      .to(`user_${recruiterId}`)
      .emit('dashboardUpdated');
  }

  async notifyCandidateOfAutoSchedule(
    candidateUserId: string,
    recruiterUserId: string,
    recruiterId: string,
    candidateId: string,
    jobTitle: string,
    interviewTime: string,
    interviewDate: Date,
  ) {
    const dateStr = interviewDate.toLocaleDateString('vi-VN');
    const msgContent = `CHÚC MỪNG! Dựa trên phân tích AI hệ thống, hồ sơ của bạn cho vị trí "${jobTitle}" đạt điểm kỹ năng xuất sắc. \n\nHệ thống đã tự động cấp đặc quyền vượt qua vòng hồ sơ và xếp lịch Phỏng vấn đặc cách cho bạn vào lúc ${interviewTime} ngày ${dateStr}. \n\nVui lòng giữ liên lạc để phòng nhân sự phản hồi sớm nhất!`;

    await this.notificationsService.create(
      candidateUserId,
      'Lịch Phỏng Vấn Đặc Cách',
      msgContent,
      'success',
      '/applied-jobs',
    );

    this.messagesGateway.server
      .to(`user_${candidateUserId}`)
      .emit('notification', {
        title: 'Lịch Phỏng Vấn Đặc Cách',
        message: msgContent,
        type: 'success',
        link: '/applied-jobs',
      });

    // Inject message into conversation
    await this.injectAutoChatMessage(recruiterUserId, recruiterId, candidateId, msgContent);
  }

  async notifyCandidateOfStatusUpdate(
    candidateUserId: string,
    companyName: string,
    jobTitle: string,
    status: string,
    details?: {
      interviewDate?: string;
      interviewTime?: string;
      interviewLocation?: string;
      isReschedule?: boolean;
    }
  ) {
    let title = 'Cập nhật trạng thái ứng tuyển';
    let message = `Trạng thái hồ sơ của bạn tại ${companyName} đã biến đổi.`;
    let type = 'info';

    if (status === 'INTERVIEWING') {
      const isReschedule = details?.isReschedule;
      title = isReschedule ? 'Lịch Phỏng Vấn Đã Dời' : 'Lịch Phỏng Vấn Mới';
      const dateStr = details?.interviewDate
        ? new Date(details.interviewDate).toLocaleDateString('vi-VN')
        : '';
      if (isReschedule) {
        message = `Lịch phỏng vấn cho vị trí "${jobTitle}" đã được dời sang ${details?.interviewTime || ''} ngày ${dateStr}. Địa điểm/Link: ${details?.interviewLocation || 'Đang cập nhật'}.`;
      } else {
        message = `Bạn có lịch phỏng vấn cho vị trí "${jobTitle}" vào ${details?.interviewTime || ''} ngày ${dateStr}. Địa điểm/Link: ${details?.interviewLocation || 'Đang cập nhật'}.`;
      }
    } else if (status === 'ACCEPTED') {
      title = 'Chúc Mừng Trúng Tuyển!';
      message = `Tuyệt vời! ${companyName} đã quyết định tiếp nhận bạn cho vị trí "${jobTitle}".`;
      type = 'success';
    } else if (status === 'REJECTED') {
      title = 'Kết Quả Phỏng Vấn';
      message = `Rất tiếc, ${companyName} thông báo bạn chưa phù hợp với vị trí "${jobTitle}" lần này. Chúc bạn may mắn lần sau.`;
    } else if (status === 'REVIEWED') {
      title = 'Hồ sơ đã được xem';
      message = `Hồ sơ của bạn đã được nhà tuyển dụng ${companyName} xem cho vị trí "${jobTitle}".`;
    }

    await this.notificationsService.create(
      candidateUserId,
      title,
      message,
      type,
      '/applied-jobs',
    );

    this.messagesGateway.server
      .to(`user_${candidateUserId}`)
      .emit('notification', { title, message, type, link: '/applied-jobs' });

    return message;
  }

  async injectAutoChatMessage(
    recruiterUserId: string,
    recruiterId: string,
    candidateId: string,
    messageContent: string,
    candidateUserIdForEmit?: string
  ) {
    let conversation = await this.prisma.conversation.findFirst({
      where: { candidateId, recruiterId },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          candidateId,
          recruiterId,
          lastMessage: '',
          isRead: false,
        },
      });
    }

    const chatMsg = await this.prisma.message.create({
      data: {
        senderId: recruiterUserId,
        conversationId: conversation.conversationId,
        content: messageContent,
      },
    });

    await this.prisma.conversation.update({
      where: { conversationId: conversation.conversationId },
      data: {
        lastMessage: messageContent,
        updatedAt: new Date(),
        isRead: false,
      },
    });

    if (candidateUserIdForEmit) {
      this.messagesGateway.server
        .to(`user_${candidateUserIdForEmit}`)
        .emit('newMessage', chatMsg);

      this.messagesGateway.server
        .to(`user_${recruiterUserId}`)
        .emit('newMessage', chatMsg);
    }
  }
}
