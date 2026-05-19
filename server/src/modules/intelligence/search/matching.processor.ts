import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MatchingOrchestratorService } from '@/modules/intelligence/matching-engine/services/matching-orchestrator.service';
import { NotificationsService } from '@/modules/communication/notifications/notifications.service';
import { MessagesGateway } from '@/modules/communication/messages/messages.gateway';
import { MessagesService } from '@/modules/communication/messages/messages.service';
import { UnlockService } from '@/modules/profiles/recruiters/unlock.service';
import { PrismaService } from '@/prisma/prisma.service';
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
      try {
        const topMatches =
          await this.matchingOrchestrator.runMatchingForJob(jobId);

        const jobPosting = await this.prisma.jobPosting.findUnique({
          where: { jobPostingId: jobId },
          include: { recruiter: true },
        });

        if (!jobPosting || !jobPosting.recruiter?.userId) {
          return { success: true, count: topMatches.length };
        }

        const recruiterUserId = jobPosting.recruiter.userId;
        const threshold = jobPosting.autoInviteThreshold ?? 70;

        // Số ứng viên phù hợp dựa THEO ĐÚNG cấu hình của user
        const matchedCandidates = topMatches.filter((m) => m.score >= threshold);

        // Luôn emit realtime matchedCount để UI cập nhật không cần F5
        this.messagesGateway.server
          .to(`user_${recruiterUserId}`)
          .emit('job_match_updated', {
            jobId,
            status: matchedCandidates.length > 0 ? 'inviting' : 'completed',
            matchedCount: matchedCandidates.length,
            autoInvitedCount: matchedCandidates.length,
          });

        if (matchedCandidates.length === 0) {
          return { success: true, count: topMatches.length };
        }

        let autoUnlockCount = 0;
        const shouldAutoInvite =
          jobPosting.autoInviteMatches === true &&
          jobPosting.status === 'APPROVED'; // Chỉ auto-invite khi bài đã được duyệt

        if (shouldAutoInvite) {
          // Tỷ lệ phễu tuyển dụng (Recruitment Funnel Ratio): Cần mời 5 người để có 1 người đi làm
          const FUNNEL_RATIO = 5;
          const limit = (jobPosting.vacancies || 1) * FUNNEL_RATIO;
          const autoInviteCandidates = matchedCandidates.slice(0, limit);

          for (const match of autoInviteCandidates) {
            try {
              // Lấy CV chính của ứng viên
              const candidateInfo = await this.prisma.candidate.findUnique({
                where: { candidateId: match.candidateId },
                include: { cvs: { where: { isMain: true } } },
              });
              const cvId = candidateInfo?.cvs?.[0]?.cvId;

              if (!cvId) {
                this.logger.warn(
                  `[AutoInvite] Candidate ${match.candidateId.slice(0, 8)} chưa có CV chính → bỏ qua`,
                );
                continue;
              }

              // Mở khoá qua UnlockService: trừ quota CV Hunter hoặc trừ xu tương ứng
              const unlockResult = (await this.unlockService.unlockCandidate(
                recruiterUserId,
                match.candidateId,
                jobId,
                cvId,
              )) as any;

              if (unlockResult?.status === 'ALREADY_UNLOCKED') {
                continue;
              }

              // Gửi lời mời tự động qua tin nhắn
              await this.messagesService.sendJobInvitationMessage(
                recruiterUserId,
                match.candidateId,
                jobId,
              );

              autoUnlockCount++;
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
            ? `AI đã tự động mở khoá và gửi lời mời đến ${autoUnlockCount} ứng viên nổi bật nhất cho "${jobPosting.title}". Tổng cộng ${matchedCandidates.length} ứng viên phù hợp ≥${threshold}%.`
            : `Hệ thống tìm thấy ${matchedCandidates.length} ứng viên phù hợp ≥${threshold}% với vị trí "${jobPosting.title}".`;

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

        this.messagesGateway.server
          .to(`user_${recruiterUserId}`)
          .emit('job_match_updated', {
            jobId,
            status: 'completed',
            matchedCount: matchedCandidates.length,
            autoInvitedCount: autoUnlockCount,
          });

        return { success: true, count: topMatches.length };
      } catch (error: any) {
        this.logger.error(
          `[Matching] Error processing job ${jobId}: ${error.message}`,
        );
        throw error;
      }
    } else if (userId) {
      try {
        const response =
          await this.matchingOrchestrator.runMatchingForCandidate(userId);
        return { success: true, count: response.length };
      } catch (error: any) {
        this.logger.error(
          `[Matching] Error for candidate ${userId}: ${error.message}`,
        );
        throw error;
      }
    }
  }
}
