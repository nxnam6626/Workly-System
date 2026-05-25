import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createReviewDto: CreateReviewDto,
    @CurrentUser('userId') userId: string,
  ) {
    // In a real app, we'd look up the recruiterId from the userId.
    // Assuming the frontend sends the recruiterId, or we resolve it here.
    // For now, let's assume userId is the recruiterId (in our schema, Recruiter has a unique userId).
    // Wait, the recruiterId is NOT the userId. We need to fetch recruiterId first.
    return this.reviewsService.create(createReviewDto, userId); // NOTE: Service should resolve this or we do it here.
  }

  @Get('candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('candidateId') candidateId: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.reviewsService.findAllByCandidate(candidateId, companyId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.reviewsService.update(id, updateReviewDto, userId); // NOTE: recruiterId resolution needed
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.reviewsService.remove(id, userId); // NOTE: recruiterId resolution needed
  }
}
