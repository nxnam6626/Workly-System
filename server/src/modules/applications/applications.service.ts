import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MessagesGateway } from '../messages/messages.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { type CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { WalletsService } from '../wallets/wallets.service';
import { AiService } from '../ai/ai.service'; // Added AiService
import { TransactionType } from '@/generated/prisma';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
    private walletsService: WalletsService,
    private aiService: AiService, // Added injection
  ) { }

  async create(
    createApplicationDto: CreateApplicationDto,
    file?: any,
    user?: CurrentUserPayload,
  ) {
    const userId = user?.userId;

    if (userId && !user.roles.includes('CANDIDATE')) {
      throw new ForbiddenException(
        'Chỉ tài khoản ứng viên mới có thể nộp đơn ứng tuyển cho công việc.',
      );
    }

    const { jobPostingId, fullName, email, phone, coverLetter } =
      createApplicationDto;

    // 1. Verify job posting exists
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng!');

    // Chặn tự ứng tuyển: Nếu người dùng là chủ của tin tuyển dụng này
    if (userId) {
      const recruiter = await this.prisma.recruiter.findUnique({
        where: { userId },
      });
      if (recruiter && recruiter.recruiterId === job.recruiterId) {
        throw new ForbiddenException(
          'Bạn không thể ứng tuyển vào tin tuyển dụng của chính mình.',
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      let candidateId: string;

      // 2. Handle Candidate identification
      if (userId) {
        // Kiểm tra xem người dùng có vai trò CANDIDATE không
        if (!user.roles.includes('CANDIDATE')) {
          throw new ForbiddenException(
            'Chỉ tài khoản ứng viên mới có thể nộp đơn ứng tuyển cho công việc.',
          );
        }

        const candidate = await tx.candidate.findUnique({ where: { userId } });
        if (!candidate) {
          throw new NotFoundException(
            'Không tìm thấy hồ sơ ứng viên. Vui lòng hoàn tất thông tin ứng viên của bạn trước.',
          );
        }
        candidateId = candidate.candidateId;
      } else {
        // Guest Application Logic
        // Check if user with email already exists
        let user = await tx.user.findUnique({ where: { email } });
        if (!user) {
          // Create a new guest user + candidate
          user = await tx.user.create({
            data: {
              email,
              status: 'ACTIVE',
              phoneNumber: phone,
            },
          });

          const roleRecord = await tx.role.upsert({
            where: { roleName: 'CANDIDATE' },
            update: {},
            create: { roleName: 'CANDIDATE' },
          });

          await tx.userRole.create({
            data: {
              userId: user.userId,
              roleId: roleRecord.roleId,
            },
          });

          const newCandidate = await tx.candidate.create({
            data: { userId: user.userId, fullName },
          });
          candidateId = newCandidate.candidateId;
        } else {
          const candidate = await tx.candidate.findUnique({
            where: { userId: user.userId },
          });
          if (!candidate) {
            const newCandidate = await tx.candidate.create({
              data: { userId: user.userId, fullName },
            });
            candidateId = newCandidate.candidateId;
          } else {
            candidateId = candidate.candidateId;
          }
        }
      }

      // 3. Handle CV File or Existing CV
      let cvId: string | undefined = createApplicationDto.cvId;
      let fileUrl: string;

      if (cvId) {
        const existingCv = await tx.cV.findUnique({ where: { cvId } });
        if (!existingCv)
          throw new NotFoundException('Không tìm thấy CV được chọn!');
        fileUrl = existingCv.fileUrl || ''; // Allow empty if virtual CV
      } else if (file) {
        const cvTitle = file.originalname;
        fileUrl = `/uploads/cvs/${file.filename}`;

        const newCV = await tx.cV.create({
          data: {
            cvTitle,
            fileUrl,
            candidateId,
            isMain: false, // Uploaded during application is not necessarily main
          },
        });
        cvId = newCV.cvId;
      } else {
        throw new NotFoundException(
          'Vui lòng tải lên CV hoặc chọn CV có sẵn!',
        );
      }

      // 4. Check for existing application
      const existingApp = await tx.application.findFirst({
        where: { candidateId, jobPostingId },
      });
      if (existingApp)
        throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

      // 5. Create Application
      // 5. Check if unlocked in CandidateUnlock table
      const existingUnlock = await tx.candidateUnlock.findUnique({
        where: {
          recruiterId_candidateId_jobPostingId: {
            recruiterId: job.recruiterId!,
            candidateId,
            jobPostingId,
          },
        },
      });
      const isAlreadyUnlocked = !!existingUnlock;

      // Check if candidate already has a match score
      const existingMatch = await tx.jobMatch.findUnique({
        where: {
          candidateId_jobPostingId: { candidateId, jobPostingId },
        },
      });

      // 6. Compute AI Match Score with Fallback mechanism
      let aiMatchScore = existingMatch?.score ?? 0;

      if (aiMatchScore === 0) {
        try {
          let cvText = '';
          if (fileUrl.startsWith('/uploads/')) {
            cvText = await this.aiService.extractTextFromLocalFile(fileUrl);
          } else {
            cvText = await this.aiService.extractTextFromPdfUrl(fileUrl);
          }

          if (cvText.trim()) {
            const jobRequirements = job.requirements
              ? String(job.requirements)
              : '';
            aiMatchScore = await this.aiService.evaluateMatch(
              cvText,
              job.title,
              jobRequirements,
            );
          }
        } catch (aiErr) {
          console.error(
            'Lỗi khi tính điểm Match bằng AI trên tệp CV ứng tuyển. Sử dụng điểm mặc định là 0:',
            aiErr,
          );
        }
      }

      let targetAppStatus = 'PENDING';
      let autoInterviewDate: Date | null = null;
      let autoInterviewTime: string | null = null;
      let autoInterviewLocation: string | null = null;

      if (aiMatchScore >= 80) {
        targetAppStatus = 'INTERVIEWING';

        let scheduleDate = new Date();
        let daysUntilThu = (4 + 7 - scheduleDate.getDay()) % 7;

        // Cần cho thí sinh chuẩn bị (nếu chênh lệch nhỏ hơn 2 ngày thì tự đẩy sang Thứ 5 tuần sau)
        if (daysUntilThu <= 2) {
          daysUntilThu += 7;
        }

        scheduleDate.setDate(scheduleDate.getDate() + daysUntilThu);
        scheduleDate.setHours(0, 0, 0, 0); // Convert to midnight

        const possibleSlots = ['08:00', '10:00', '14:00', '16:00'];
        let foundSlot = false;

        while (!foundSlot) {
          const startOfDay = new Date(scheduleDate);
          const endOfDay = new Date(scheduleDate);
          endOfDay.setHours(23, 59, 59, 999);

          const scheduledApps = await tx.application.findMany({
            where: {
              jobPostingId,
              appStatus: 'INTERVIEWING',
              interviewDate: {
                gte: startOfDay,
                lte: endOfDay
              }
            },
            select: { interviewTime: true }
          });

          const slotCounts: Record<string, number> = {};
          possibleSlots.forEach(s => slotCounts[s] = 0);
          scheduledApps.forEach(app => {
            if (app.interviewTime && slotCounts[app.interviewTime] !== undefined) {
              slotCounts[app.interviewTime]++;
            }
          });

          for (const slot of possibleSlots) {
            if (slotCounts[slot] < 5) {
              autoInterviewDate = new Date(scheduleDate);
              autoInterviewTime = slot;
              foundSlot = true;
              break;
            }
          }

          if (!foundSlot) {
            scheduleDate.setDate(scheduleDate.getDate() + 7);
          }
        }

        autoInterviewLocation = 'Workly System tự động xếp lịch. Vui lòng đợi HR liên hệ ấn định chi tiết (Phỏng vấn qua Meet/Trực tiếp).';
      }

      const application = await tx.application.create({
        data: {
          candidateId,
          jobPostingId,
          cvId,
          cvSnapshotUrl: fileUrl,
          coverLetter,
          appStatus: targetAppStatus as any,
          interviewDate: autoInterviewDate,
          interviewTime: autoInterviewTime,
          interviewLocation: autoInterviewLocation,
          aiMatchScore,
          isUnlocked: true, // Luôn mặc định mở khóa cho ứng viên chủ động ứng tuyển tự nguyện
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: { select: { fullName: true } },
        },
      });

      // 6. Send Notification
      if (application.jobPosting.recruiter?.userId) {
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

      // 7. Auto-Send Chat and Notify Candidate if Auto-Scheduled!
      if (targetAppStatus === 'INTERVIEWING') {
        const candidateUser = await tx.candidate.findUnique({
          where: { candidateId },
          select: { userId: true },
        });

        if (candidateUser?.userId && application.jobPosting.recruiter?.userId) {
          const recruiterUserId = application.jobPosting.recruiter.userId;
          const recruiterId = application.jobPosting.recruiterId;

          const dateStr = autoInterviewDate ? autoInterviewDate.toLocaleDateString('vi-VN') : '';
          const msgContent = `CHÚC MỪNG! Dựa trên phân tích AI hệ thống, hồ sơ của bạn cho vị trí "${application.jobPosting.title}" đạt điểm kỹ năng xuất sắc. \n\nHệ thống đã tự động cấp đặc quyền vượt qua vòng hồ sơ và xếp lịch Phỏng vấn đặc cách cho bạn vào lúc ${autoInterviewTime} ngày ${dateStr}. \n\nVui lòng giữ liên lạc để phòng nhân sự phản hồi sớm nhất!`;

          await this.notificationsService.create(
            candidateUser.userId,
            'Lịch Phỏng Vấn Đặc Cách',
            msgContent,
            'success',
            '/applied-jobs',
          );

          this.messagesGateway.server
            .to(`user_${candidateUser.userId}`)
            .emit('notification', {
              title: 'Lịch Phỏng Vấn Đặc Cách',
              message: msgContent,
              type: 'success',
              link: '/applied-jobs',
            });

          // Inject message into conversation
          if (recruiterId) {
            let conversation = await tx.conversation.findFirst({
              where: { candidateId, recruiterId }
            });
            if (!conversation) {
              conversation = await tx.conversation.create({
                data: { candidateId, recruiterId, lastMessage: '', isRead: false }
              });
            }

            await tx.message.create({
              data: {
                senderId: recruiterUserId,
                conversationId: conversation.conversationId,
                content: msgContent
              }
            });

            await tx.conversation.update({
              where: { conversationId: conversation.conversationId },
              data: { lastMessage: msgContent, updatedAt: new Date(), isRead: false }
            });
          }
        }
      }

      return application;
    },
      {
        maxWait: 5000,
        timeout: 30000, // 30 seconds to allow slow Gemini API responses
      },
    );
  }

  async findAllByJob(jobPostingId: string) {
    return this.prisma.application.findMany({
      where: { jobPostingId },
      include: {
        candidate: true,
        cv: true,
      },
    });
  }

  async findAllByCandidate(candidateId: string) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        jobPosting: { include: { company: true } },
      },
      orderBy: { applyDate: 'desc' },
    });
  }

  async findAllForUser(userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });
    if (!candidate) return [];
    return this.findAllByCandidate(candidate.candidateId);
  }

  async findAllForRecruiter(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    const applications = await this.prisma.application.findMany({
      where: {
        jobPosting: {
          recruiterId: recruiter.recruiterId,
        },
      },
      include: {
        candidate: { include: { user: true, skills: true } },
        jobPosting: { select: { title: true, company: true } },
        cv: true,
      },
      orderBy: { aiMatchScore: 'desc' }, // Order by AI Score primarily for recruiter
    });

    // Fetch all Candidate Unlocks to fix any out-of-sync application unlock logic
    const unlocks = await this.prisma.candidateUnlock.findMany({
      where: { recruiterId: recruiter.recruiterId },
    });
    const unlockedSet = new Set(
      unlocks.map((u) => `${u.candidateId}_${u.jobPostingId}`),
    );

    // Fetch JobMatches to sync accurate AI Score and retro-active unlock checks
    const jobMatches = await this.prisma.jobMatch.findMany({
      where: { jobPosting: { recruiterId: recruiter.recruiterId } },
    });
    const matchMap = new Map(
      jobMatches.map((m) => [`${m.candidateId}_${m.jobPostingId}`, m]),
    );

    return applications.map((app) => {
      // Re-validate exactly
      const matchData = matchMap.get(`${app.candidateId}_${app.jobPostingId}`);
      const isActuallyUnlocked =
        app.isUnlocked ||
        unlockedSet.has(`${app.candidateId}_${app.jobPostingId}`);
      const accurateScore =
        matchData?.score && matchData.score > 0
          ? matchData.score
          : app.aiMatchScore;

      // Obfuscate candidate details if not unlocked
      if (!isActuallyUnlocked) {
        return {
          ...app,
          isUnlocked: false,
          aiMatchScore: accurateScore,
          candidate: {
            ...app.candidate,
            fullName: '*** Ứng viên ẩn ***',
            user: {
              ...app.candidate.user,
              email: '***@***.***',
              phoneNumber: '***',
            },
          },
          cv: {
            ...app.cv,
            fileUrl: '',
          },
          cvSnapshotUrl: '',
        };
      }
      return {
        ...app,
        isUnlocked: true,
        aiMatchScore: accurateScore,
      };
    });
  }

  async updateStatus(
    applicationId: string,
    actionUserId: string,
    status: any,
    interviewDate?: string,
    interviewTime?: string,
    interviewLocation?: string,
  ) {
    // Kiểm tra xem có phải là dời lịch hay không
    const existingApp = await this.prisma.application.findUnique({
      where: { applicationId },
      select: { interviewDate: true, appStatus: true, jobPostingId: true },
    });

    const isReschedule =
      status === 'INTERVIEWING' &&
      existingApp?.appStatus === 'INTERVIEWING' &&
      existingApp?.interviewDate != null;

    const dataToUpdate: any = { appStatus: status };
    if (status === 'INTERVIEWING') {
      if (interviewDate) dataToUpdate.interviewDate = new Date(interviewDate);
      if (interviewTime) dataToUpdate.interviewTime = interviewTime;
      if (interviewLocation) dataToUpdate.interviewLocation = interviewLocation;
    }

    if (
      status === 'ACCEPTED' &&
      existingApp &&
      existingApp.appStatus !== 'ACCEPTED'
    ) {
      // Decrease vacancies when candidate is accepted
      await this.prisma.jobPosting.update({
        where: { jobPostingId: existingApp.jobPostingId },
        data: {
          vacancies: { decrement: 1 },
        },
      });
    }

    const application = await this.prisma.application.update({
      where: { applicationId },
      data: dataToUpdate,
      include: {
        jobPosting: {
          select: {
            title: true,
            recruiterId: true,
            recruiter: { select: { userId: true } },
            company: { select: { companyName: true } },
          },
        },
        candidate: {
          select: { userId: true, fullName: true, candidateId: true },
        },
      },
    });

    if (application.candidate?.userId) {
      const candidateUserId = application.candidate.userId;
      const companyName =
        application.jobPosting?.company?.companyName || 'Công ty';
      const jobTitle = application.jobPosting?.title || 'Công việc';

      let title = 'Cập nhật trạng thái ứng tuyển';
      let message = `Trạng thái hồ sơ của bạn tại ${companyName} đã biến đổi.`;
      let type = 'info';

      if (status === 'INTERVIEWING') {
        title = isReschedule ? 'Lịch Phỏng Vấn Đã Dời' : 'Lịch Phỏng Vấn Mới';
        const dateStr = interviewDate
          ? new Date(interviewDate).toLocaleDateString('vi-VN')
          : '';
        if (isReschedule) {
          message = `Lịch phỏng vấn cho vị trí "${jobTitle}" đã được dời sang ${interviewTime || ''} ngày ${dateStr}. Địa điểm/Link: ${interviewLocation || 'Đang cập nhật'}.`;
        } else {
          message = `Bạn có lịch phỏng vấn cho vị trí "${jobTitle}" vào ${interviewTime || ''} ngày ${dateStr}. Địa điểm/Link: ${interviewLocation || 'Đang cập nhật'}.`;
        }
        type = 'info';
      } else if (status === 'ACCEPTED') {
        title = 'Chúc Mừng Trúng Tuyển!';
        message = `Tuyệt vời! ${companyName} đã quyết định tiếp nhận bạn cho vị trí "${jobTitle}".`;
        type = 'success';
      } else if (status === 'REJECTED') {
        title = 'Kết Quả Phỏng Vấn';
        message = `Rất tiếc, ${companyName} thông báo bạn chưa phù hợp với vị trí "${jobTitle}" lần này. Chúc bạn may mắn lần sau.`;
        type = 'info';
      } else if (status === 'REVIEWED') {
        title = 'Hồ sơ đã được xem';
        message = `Hồ sơ của bạn đã được nhà tuyển dụng ${companyName} xem cho vị trí "${jobTitle}".`;
        type = 'info';
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

      // Gửi tin nhắn tự động vào hộp thoại Chat
      if (['INTERVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) {
        // Lấy ID recruiter của người đang thực hiện duyệt đơn (nếu có)
        const actionRecruiter = await this.prisma.recruiter.findUnique({
          where: { userId: actionUserId },
        });
        const recruiterId =
          actionRecruiter?.recruiterId || application.jobPosting.recruiterId;
        const recruiterUserId = actionUserId;
        const candidateId = application.candidate.candidateId;

        if (recruiterId && candidateId) {
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
              content: message,
            },
          });

          await this.prisma.conversation.update({
            where: { conversationId: conversation.conversationId },
            data: {
              lastMessage: message,
              updatedAt: new Date(),
              isRead: false,
            },
          });

          // Load lại conversation cùng message để emit có thể đồng bộ đầy đủ
          const fullMsg = await this.prisma.message.findUnique({
            where: { messageId: chatMsg.messageId },
          });

          if (fullMsg) {
            this.messagesGateway.server
              .to(`user_${candidateUserId}`)
              .emit('newMessage', fullMsg);

            this.messagesGateway.server
              .to(`user_${recruiterUserId}`)
              .emit('newMessage', fullMsg);
          }
        }
      }
    }

    return application;
  }

  async unlockApplication(applicationId: string, recruiterUserId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId: recruiterUserId },
    });

    if (!recruiter) throw new NotFoundException('Recruiter not found');

    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { candidate: true },
    });

    if (!application) throw new NotFoundException('Application not found');
    if (application.isUnlocked) return application;

    await this.walletsService.deductCvUnlock(
      recruiter.recruiterId,
      `Mở khóa ứng viên: ${application.candidate?.fullName}`,
    );

    return this.prisma.application.update({
      where: { applicationId },
      data: { isUnlocked: true },
    });
  }

  async remove(applicationId: string, candidateUserId: string) {
    const application = await this.prisma.application.findUnique({
      where: { applicationId },
      include: { candidate: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.candidate?.userId !== candidateUserId)
      throw new ConflictException('Unauthorized to delete this application');

    return this.prisma.application.delete({
      where: { applicationId },
    });
  }

  @Cron('* * * * *') // Run every minute for testing/live tracking
  async checkPastInterviews() {
    try {
      const now = new Date();
      console.log(`[Cron] Checking for past interviews at ${now.toLocaleTimeString('vi-VN')}...`);

      const interviewingApps = await this.prisma.application.findMany({
        where: {
          appStatus: 'INTERVIEWING',
          interviewDate: { not: null },
          interviewTime: { not: null }
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: true
        }
      });

      for (const app of interviewingApps) {
        if (!app.interviewDate || !app.interviewTime || !app.jobPosting.recruiter?.userId) continue;

        const [hours, minutes] = app.interviewTime.split(':').map(Number);
        const interviewDateTime = new Date(app.interviewDate);
        interviewDateTime.setHours(hours, minutes, 0, 0);

        // Notify 2 hours after the interview start time
        interviewDateTime.setHours(interviewDateTime.getHours() + 2);

        if (now > interviewDateTime) {
          const recruiterId = app.jobPosting.recruiter.userId;
          const trackingLink = `/recruiter/applications?remind=${app.applicationId}`;

          const existingNotif = await this.prisma.notification.findFirst({
            where: {
              userId: recruiterId,
              link: trackingLink
            }
          });

          if (!existingNotif) {
            console.log(`[Cron] Sending reminder for candidate ${app.candidate.fullName} (Application: ${app.applicationId}) to recruiter ${recruiterId}`);

            const title = 'Cập nhật kết quả phỏng vấn';
            const message = `Buổi phỏng vấn với ứng viên ${app.candidate.fullName} đã diễn ra. Vui lòng cập nhật trạng thái đã phỏng vấn hay chưa (Chấp nhận/Từ chối).`;

            await this.notificationsService.create(
              recruiterId,
              title,
              message,
              'warning',
              trackingLink
            );

            this.messagesGateway.server
              .to(`user_${recruiterId}`)
              .emit('notification', {
                title,
                message,
                type: 'warning',
                link: trackingLink
              });
          }
        }
      }
    } catch (err) {
      console.error('Error in checkPastInterviews cron job:', err);
    }
  }
}
