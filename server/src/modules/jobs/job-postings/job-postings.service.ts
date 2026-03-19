import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class JobPostingsService {
  constructor(private prisma: PrismaService) { }

  async create(createJobPostingDto: CreateJobPostingDto, userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });

    if (!recruiter || !recruiter.companyId) {
      throw new NotFoundException('Thông tin nhà tuyển dụng hoặc công ty chưa được thiết lập.');
    }

    const { deadline, salaryMin, salaryMax, ...rest } = createJobPostingDto;

    // Kiểm tra logic lương
    if (salaryMin !== undefined && salaryMax !== undefined && salaryMin > salaryMax) {
      throw new ForbiddenException('Lương tối thiểu không thể lớn hơn lương tối đa.');
    }

    // Kiểm tra logic deadline
    if (deadline && deadline < Date.now()) {
      throw new ForbiddenException('Ngày hết hạn không thể là một ngày trong quá khứ.');
    }

    return this.prisma.jobPosting.create({
      data: {
        ...rest,
        deadline: deadline ? new Date(deadline) : null,
        recruiterId: recruiter.recruiterId,
        companyId: recruiter.companyId,
        postType: 'MANUAL',
        status: 0,
        isVerified: false,
      },
    });
  }



  async findAll() {
    return this.prisma.jobPosting.findMany({
      include: {
        company: true,
        recruiter: true,
      },

      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { jobPostingId: id },
      include: { company: true, recruiter: true },
    });

    if (!job) throw new NotFoundException(`Không tìm thấy Job với ID ${id}`);
    return job;
  }

  async update(id: string, updateJobPostingDto: UpdateJobPostingDto) {
    // Kiểm tra tồn tại trước khi update
    await this.findOne(id);

    const { deadline, ...rest } = updateJobPostingDto;

    return this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...rest,
        ...(deadline && { deadline: new Date(deadline) }),
        updatedAt: new Date(),
      },
    });
  }


  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.jobPosting.delete({
      where: { jobPostingId: id },
    });
  }
}
