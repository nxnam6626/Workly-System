import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchingService } from './matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('matching')
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesGateway: MessagesGateway,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId } = job.data;
    this.logger.log(`Processing matching job for Job ID: ${jobId}`);

    try {
      const topMatches = await this.matchingService.runMatchingForJob(jobId);
      
      if (topMatches.length > 0) {
        // Lưu kết quả hoặc chỉ gửi thông báo
        // Theo yêu cầu: TỰ ĐỘNG gửi Email/Thông báo cho Nhà tuyển dụng
        const jobPosting = await this.prisma.jobPosting.findUnique({
          where: { jobPostingId: jobId },
          include: { recruiter: true },
        });

        if (jobPosting && jobPosting.recruiter?.userId) {
          const title = 'Đã tìm thấy ứng viên phù hợp!';
          const message = `Hệ thống đã tìm thấy ${topMatches.length} ứng viên cực kỳ phù hợp với vị trí "${jobPosting.title}" của bạn.`;
          
          await this.notificationsService.create(
            jobPosting.recruiter.userId,
            title,
            message,
            'success',
            `/recruiter/candidates/matched/${jobId}`
          );

          this.messagesGateway.server
            .to(`user_${jobPosting.recruiter.userId}`)
            .emit('notification', {
              title,
              message,
              type: 'success',
              link: `/recruiter/candidates/matched/${jobId}`,
            });
        }
      }

      return { success: true, count: topMatches.length };
    } catch (error) {
      this.logger.error(`Error in MatchingProcessor: ${error.message}`);
      throw error;
    }
  }
}
