import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchingOrchestratorService } from '../matching-engine/services/matching-orchestrator.service';
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
    private readonly matchingOrchestrator: MatchingOrchestratorService,
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
      this.logger.log(`[Matching] Processing job ${jobId}`);
      try {
        const topMatches = await this.matchingOrchestrator.runMatchingForJob(jobId);

        const jobPosting = await this.prisma.jobPosting.findUnique({
          where: { jobPostingId: jobId },
          include: { recruiter: true },
        });

        if (!jobPosting || !jobPosting.recruiter?.userId) {
          return { success: true, count: topMatches.length };
        }

        const recruiterUserId = jobPosting.recruiter.userId;

        // Lọc ứng viên đạt ngưỡng ≥ 70%
        const highMatches = topMatches.filter(m => m.score >= 70);
        this.logger.log(
          `[Matching] Job ${jobId}: total=${topMatches.length}, high(>=70%)=${highMatches.length}, status=${jobPosting.status}`,
        );

        // Luôn emit realtime matchedCount để UI cập nhật không cần F5
        this.messagesGateway.server
          .to(`user_${recruiterUserId}`)
          .emit('job_match_updated', {
            jobId,
            matchedCount: highMatches.length,
          });

        if (highMatches.length === 0) {
          return { success: true, count: topMatches.length };
        }

        let autoUnlockCount = 0;
        const shouldAutoInvite =
          jobPosting.autoInviteMatches === true &&
          jobPosting.status === 'APPROVED'; // Chỉ auto-invite khi bài đã được duyệt

        this.logger.log(
          `[AutoInvite] Job ${jobId}: autoInviteMatches=${jobPosting.autoInviteMatches}, status=${jobPosting.status}, willRun=${shouldAutoInvite}`,
        );

        if (shouldAutoInvite) {
          const limit = jobPosting.vacancies || 1;
          const autoInviteCandidates = highMatches.slice(0, limit);
          this.logger.log(
            `[AutoInvite] Processing ${autoInviteCandidates.length} candidates (limit=${limit} từ vacancies)`,
          );

          for (const match of autoInviteCandidates) {
            try {
              // Lấy CV chính của ứng viên
              const candidateInfo = await this.prisma.candidate.findUnique({
                where: { candidateId: match.candidateId },
                include: { cvs: { where: { isMain: true } } },
              });
              const cvId = candidateInfo?.cvs?.[0]?.cvId;
              this.logger.log(
                `[AutoInvite] Candidate ${match.candidateId.slice(0, 8)}: score=${match.score}, cvId=${cvId?.slice(0, 8) || 'NONE'}`,
              );

              if (!cvId) {
                this.logger.warn(
                  `[AutoInvite] Candidate ${match.candidateId.slice(0, 8)} chưa có CV chính → bỏ qua`,
                );
                continue;
              }

              // Mở khoá qua UnlockService: trừ quota CV Hunter hoặc trừ xu tương ứng
              const unlockResult = await this.unlockService.unlockCandidate(
                recruiterUserId,
                match.candidateId,
                jobId,
                cvId,
              ) as any;

              if (unlockResult?.status === 'ALREADY_UNLOCKED') {
                this.logger.log(
                  `[AutoInvite] Candidate ${match.candidateId.slice(0, 8)} đã được mở khoá trước đó → bỏ qua gửi lời mời`,
                );
                continue;
              }

              // Gửi lời mời tự động qua tin nhắn
              await this.messagesService.sendJobInvitationMessage(
                recruiterUserId,
                match.candidateId,
                jobId,
              );

              autoUnlockCount++;
              this.logger.log(
                `[AutoInvite] ✅ Mở khoá & gửi lời mời thành công cho candidate ${match.candidateId.slice(0, 8)} (score=${match.score}%)`,
              );
            } catch (e: any) {
              // Nếu không đủ quota/xu → log warning và tiếp tục với ứng viên tiếp theo
              if (e?.status === 400 || e?.response?.statusCode === 400) {
                this.logger.warn(
                  `[AutoInvite] Không đủ xu/quota để mở khoá candidate ${match.candidateId.slice(0, 8)}: ${e.message}`,
                );
              } else {
                this.logger.error(
                  `[AutoInvite] Lỗi khi xử lý candidate ${match.candidateId.slice(0, 8)}: ${e.message}`,
                );
              }
              // Không throw → tiếp tục xử lý ứng viên còn lại
            }
          }
        }

        // Gửi thông báo tổng kết
        const title =
          autoUnlockCount > 0
            ? `Đã mời tự động ${autoUnlockCount} ứng viên phù hợp!`
            : 'Tìm thấy ứng viên phù hợp!';
        const message =
          autoUnlockCount > 0
            ? `AI đã tự động mở khoá và gửi lời mời đến ${autoUnlockCount} ứng viên nổi bật nhất cho "${jobPosting.title}". Tổng cộng ${highMatches.length} ứng viên phù hợp ≥70%.`
            : `Hệ thống tìm thấy ${highMatches.length} ứng viên phù hợp ≥70% với vị trí "${jobPosting.title}".`;

        await this.notificationsService.create(
          recruiterUserId,
          title,
          message,
          'candidate_match',
          `/recruiter/jobs?matchJobId=${jobId}`,
        );

        this.messagesGateway.server
          .to(`user_${recruiterUserId}`)
          .emit('notification', {
            title,
            message,
            type: 'candidate_match',
            link: `/recruiter/jobs?matchJobId=${jobId}`,
          });

        return { success: true, count: topMatches.length };
      } catch (error: any) {
        this.logger.error(`[Matching] Error processing job ${jobId}: ${error.message}`);
        throw error;
      }
    } else if (userId) {
      this.logger.log(`[Matching] Processing candidate ${userId}`);
      try {
        const response = await this.matchingOrchestrator.runMatchingForCandidate(userId);
        return { success: true, count: response.results.length };
      } catch (error: any) {
        this.logger.error(`[Matching] Error for candidate ${userId}: ${error.message}`);
        throw error;
      }
    }
  }
}
