import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { MessagesGateway } from '../messages/messages.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private messagesGateway: MessagesGateway,
    private notificationsService: NotificationsService
  ) {}

  async create(createApplicationDto: CreateApplicationDto, file?: any, userId?: string) {
    const { jobPostingId, fullName, email, phone, coverLetter } = createApplicationDto;

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
             }
          });

          const newCandidate = await tx.candidate.create({
            data: { userId: user.userId, fullName },
          });
          candidateId = newCandidate.candidateId;
        } else {
          const candidate = await tx.candidate.findUnique({ where: { userId: user.userId } });
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
        if (!existingCv) throw new NotFoundException('Không tìm thấy CV được chọn!');
        fileUrl = existingCv.fileUrl;
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
      if (existingApp) throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

      // 5. Create Application
      const application = await tx.application.create({
        data: {
          candidateId,
          jobPostingId,
          cvId,
          cvSnapshotUrl: fileUrl,
          coverLetter,
          appStatus: 'PENDING',
        },
        include: {
          jobPosting: { include: { recruiter: true } },
          candidate: { select: { fullName: true } },
        }
      });

      // 6. Send Notification
      if (application.jobPosting.recruiter?.userId) {
         const recruiterId = application.jobPosting.recruiter.userId;
         const title = 'Hồ sơ ứng viên mới';
         const message = `Ứng viên ${application.candidate.fullName} vừa nộp hồ sơ cho vị trí "${application.jobPosting.title}".`;
         
         await this.notificationsService.create(recruiterId, title, message, 'info');

         this.messagesGateway.server
            .to(`user_${recruiterId}`)
            .emit('notification', { title, message, type: 'info' });
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
        }
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
    const recruiter = await this.prisma.recruiter.findUnique({ where: { userId } });
    if (!recruiter) {
      throw new NotFoundException('Recruiter not found');
    }

    return this.prisma.application.findMany({
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
      orderBy: { applyDate: 'desc' },
    });
  }

  async updateStatus(applicationId: string, status: any) {
    return this.prisma.application.update({
      where: { applicationId },
      data: { appStatus: status },
    });
  }

  async remove(applicationId: string, userId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { userId },
    });

    if (!candidate) {
      throw new NotFoundException('Thông tin ứng viên không tồn tại.');
    }

    const application = await this.prisma.application.findUnique({
      where: { applicationId },
    });

    if (!application) {
      throw new NotFoundException('Không tìm thấy đơn ứng tuyển.');
    }

    if (application.candidateId !== candidate.candidateId) {
      throw new ConflictException('Bạn không có quyền hủy đơn ứng tuyển này.');
    }

    // Only allow canceling if still pending
    if (application.appStatus !== 'PENDING') {
      throw new ConflictException('Bạn chỉ có thể hủy đơn ứng tuyển khi hồ sơ còn đang chờ duyệt.');
    }

    return this.prisma.application.delete({
      where: { applicationId },
    });
  }
}
