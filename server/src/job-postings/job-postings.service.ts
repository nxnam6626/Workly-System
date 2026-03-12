import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JobPostingsService {
  constructor(private prisma: PrismaService) {}

  async create(createJobPostingDto: CreateJobPostingDto) {
    return this.prisma.jobPosting.create({
      data: {
        ...createJobPostingDto,

        status: createJobPostingDto.status ?? 1,
        isVerified: createJobPostingDto.isVerified ?? false,
        createdAt: new Date(),
        adminId: createJobPostingDto.adminId,
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

    return this.prisma.jobPosting.update({
      where: { jobPostingId: id },
      data: {
        ...updateJobPostingDto,
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
