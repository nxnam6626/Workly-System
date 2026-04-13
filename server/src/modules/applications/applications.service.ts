import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MessagesGateway } from '../messages/messages.gateway';
import { NotificationsService } from '../notifications/notifications.service';

import { WalletsService } from '../wallets/wallets.service';
import { AiService } from '../ai/ai.service'; // Added AiService
import { TransactionType } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService,
    private walletsService: WalletsService,
    private aiService: AiService, // Added injection
  ) {}

  async create(
    createApplicationDto: CreateApplicationDto,
    file?: any,
    userId?: string,
  ) {
    const { jobPostingId, fullName, email, phone, coverLetter } =
      createApplicationDto;

    // 1. Verify job posting exists
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId },
    });
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng!');

    return await this.prisma.$transaction(async (tx) => {
      let candidateId: string;

      // 2. Handle Candidate identification
      if (userId) {
        const candidate = await tx.candidate.findUnique({ where: { userId } });
        if (!candidate) {
          // If logged in user is not a candidate, create one
          const newCandidate = await tx.candidate.create({
            data: { userId, fullName },
          });
          candidateId = newCandidate.candidateId;
        } else {
          candidateId = candidate.candidateId;
        }
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
        throw new NotFoundException('Vui lòng tải lên CV hoặc chọn CV có sẵn!');
      }

      // 4. Check for existing application
      const existingApp = await tx.application.findFirst({
        where: { candidateId, jobPostingId },
      });
      if (existingApp)
        throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

      // 5. Create Application
      // 5. Compute AI Match Score
      let cvText = '';
      if (fileUrl.startsWith('/uploads/')) {
        cvText = await this.aiService.extractTextFromLocalFile(fileUrl);
      } else {
        cvText = await this.aiService.extractTextFromPdfUrl(fileUrl);
      }

      const jobRequirements = job.requirements ? String(job.requirements) : '';
      const aiMatchScore = await this.aiService.evaluateMatch(
        cvText,
        job.title,
        jobRequirements,
      );

      const application = await tx.application.create({
        data: {
          candidateId,
          jobPostingId,
          cvId,
          cvSnapshotUrl: fileUrl,
          coverLetter,
          appStatus: 'PENDING',
          aiMatchScore,
          isUnlocked: false,
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
      }

      return application;
    });
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

    return applications.map((app) => {
      // Obfuscate candidate details if not unlocked
      if (!app.isUnlocked) {
        return {
          ...app,
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
      return app;
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
      select: { interviewDate: true, appStatus: true },
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
      `Mở khóa ứng viên: ${application.candidate?.fullName}`
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
}
