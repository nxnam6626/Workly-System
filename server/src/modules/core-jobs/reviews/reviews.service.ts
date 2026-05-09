import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getRecruiterByUserId(userId: string) {
    const recruiter = await this.prisma.recruiter.findUnique({
      where: { userId },
    });
    if (!recruiter) {
      throw new UnauthorizedException('User is not a recruiter');
    }
    return recruiter;
  }

  async create(createReviewDto: CreateReviewDto, userId: string) {
    const recruiter = await this.getRecruiterByUserId(userId);
    return await this.prisma.candidateReview.create({
      data: {
        candidateId: createReviewDto.candidateId,
        recruiterId: recruiter.recruiterId,
        jobPostingId: createReviewDto.jobPostingId,
        rating: createReviewDto.rating,
        content: createReviewDto.content,
      },
      include: {
        recruiter: {
          select: {
            fullName: true,
            user: { select: { avatar: true } }
          }
        }
      }
    });
  }

  async findAllByCandidate(candidateId: string, companyId?: string) {
    return await this.prisma.candidateReview.findMany({
      where: {
        candidateId,
        ...(companyId && {
          recruiter: { companyId }
        })
      },
      include: {
        recruiter: {
          select: {
            fullName: true,
            user: { select: { avatar: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, updateReviewDto: UpdateReviewDto, userId: string) {
    const recruiter = await this.getRecruiterByUserId(userId);
    const review = await this.prisma.candidateReview.findUnique({ where: { reviewId: id } });
    
    if (!review) throw new NotFoundException('Review not found');
    if (review.recruiterId !== recruiter.recruiterId) throw new UnauthorizedException('Not your review');

    return await this.prisma.candidateReview.update({
      where: { reviewId: id },
      data: updateReviewDto,
      include: {
        recruiter: {
          select: { fullName: true, user: { select: { avatar: true } } }
        }
      }
    });
  }

  async remove(id: string, userId: string) {
    const recruiter = await this.getRecruiterByUserId(userId);
    const review = await this.prisma.candidateReview.findUnique({ where: { reviewId: id } });
    
    if (!review) throw new NotFoundException('Review not found');
    if (review.recruiterId !== recruiter.recruiterId) throw new UnauthorizedException('Not your review');

    return await this.prisma.candidateReview.delete({
      where: { reviewId: id },
    });
  }
}
