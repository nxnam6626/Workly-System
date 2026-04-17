import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchingService } from './matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { MessagesGateway } from '../messages/messages.gateway';
import { MessagesService } from '../messages/messages.service';
import { UnlockService } from '../recruiters/unlock.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Logger, Inject, forwardRef } from '@nestjs/common';

@Processor('matching')
export class MatchingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchingProcessor.name);

  constructor(
    private readonly matchingService: MatchingService,
    private readonly notificationsService: NotificationsService,
    private readonly messagesGateway: MessagesGateway,
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => UnlockService))
    private readonly unlockService: UnlockService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { jobId, userId } = job.data;

    if (jobId) {
      this.logger.log(`Processing matching job for Job ID: ${jobId}`);
      try {
        const topMatches = await this.matchingService.runMatchingForJob(jobId);

        if (topMatches.length > 0) {
          // Lưu kết quả hoặc chỉ gửi thông báo
          const jobPosting = await this.prisma.jobPosting.findUnique({
            where: { jobPostingId: jobId },
            include: { recruiter: true },
          });

          if (jobPosting && jobPosting.recruiter?.userId) {

            const highMatches = topMatches.filter(m => m.score >= 70);

            if (highMatches.length > 0) {
              // Auto Invite Feature
              let autoUnlockCount = 0;
              if ((jobPosting as any).autoInviteMatches) {
                const autoInviteCandidates = highMatches.slice(0, 5); // Limit 5
                for (const match of autoInviteCandidates) {
                  try {
                    // Unlock it (deducts CV/credits inside this service)
                    const unlockResponse = await this.unlockService.unlockCandidate(
                      jobPosting.recruiter.userId,
                      match.candidateId,
                      jobId,
                      match.cvId
                    ) as any;
                    if (unlockResponse && unlockResponse.status !== 'ALREADY_UNLOCKED') {
                      // Auto-send invitation!
                      await this.messagesService.sendJobInvitationMessage(
                        jobPosting.recruiter.userId,
                        match.candidateId,
                        jobId
                      );
                      autoUnlockCount++;
                    }
                  } catch (e: any) {
                    this.logger.error(`Failed to auto-unlock candidate ${match.candidateId}: ${e.message}`);
                    // Do not throw, keep processing other candidates
                  }
                }
              }

              const title = autoUnlockCount > 0 ? `Đã tìm thấy & mời tự động ${autoUnlockCount} ứng viên phù hợp!` : 'Đã tìm thấy ứng viên phù hợp!';
              const message = autoUnlockCount > 0
                ? `Hệ thống vừa tự động mở khoá và mời ứng tuyển ${autoUnlockCount} ứng viên nổi bật nhất cho vị trí "${jobPosting.title}". Bạn có tổng cộng ${highMatches.length} ứng viên phù hợp cao.`
                : `Hệ thống đã tìm thấy ${highMatches.length} ứng viên cực kỳ phù hợp (trên 65% độ khớp) với vị trí "${jobPosting.title}" của bạn.`;

              await this.notificationsService.create(
                jobPosting.recruiter.userId,
                title,
                message,
                'candidate_match', // specific type for UI
                `/recruiter/jobs?matchJobId=${jobId}`,
              );

              this.messagesGateway.server
                .to(`user_${jobPosting.recruiter.userId}`)
                .emit('notification', {
                  title,
                  message,
                  type: 'candidate_match',
                  link: `/recruiter/jobs?matchJobId=${jobId}`,
                });
            }
          }

        }

        return { success: true, count: topMatches.length };
      } catch (error) {
        this.logger.error(`Error in MatchingProcessor (Job): ${error.message}`);
        throw error;
      }
    } else if (userId) {
      this.logger.log(`Processing candidate matching for User ID: ${userId}`);
      try {
        const topMatches =
          await this.matchingService.runMatchingForCandidate(userId);
        return { success: true, count: topMatches.length };
      } catch (error) {
        this.logger.error(
          `Error in MatchingProcessor (Candidate): ${error.message}`,
        );
        throw error;
      }
    }
  }
}
