import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

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

      // 3. Handle CV File
      let cvId: string;
      const cvTitle = file ? file.originalname : `${fullName}_CV`;
      const fileUrl = file ? `/uploads/cvs/${file.filename}` : '/uploads/cvs/default.pdf';

      const newCV = await tx.cV.create({
        data: {
          cvTitle,
          fileUrl,
          candidateId,
          isMain: true,
        },
      });
      cvId = newCV.cvId;

      // 4. Check for existing application
      const existingApp = await tx.application.findFirst({
        where: { candidateId, jobPostingId },
      });
      if (existingApp) throw new ConflictException('Bạn đã nộp đơn cho công việc này rồi!');

      // 5. Create Application
      return tx.application.create({
        data: {
          candidateId,
          jobPostingId,
          cvId,
          cvSnapshotUrl: fileUrl,
          coverLetter,
          appStatus: 'PENDING',
        },
        include: {
          jobPosting: { select: { title: true } },
          candidate: { select: { fullName: true } },
        }
      });
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
}
