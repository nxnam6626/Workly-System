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
import { JobPostingsService } from './job-postings.service';
import { CreateJobPostingDto } from './dto/create-job-posting.dto';
import { UpdateJobPostingDto } from './dto/update-job-posting.dto';
import { FilterJobPostingDto } from './dto/filter-job-posting.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { Role } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';

@Controller('job-postings')
export class JobPostingsController {
  constructor(private readonly jobPostingsService: JobPostingsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  create(
    @Body() createJobPostingDto: CreateJobPostingDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.jobPostingsService.create(createJobPostingDto, userId);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  findMyJobs(@CurrentUser('userId') userId: string) {
    return this.jobPostingsService.findMyJobs(userId);
  }

  @Get(':id/suggested-candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  getSuggestedCandidates(@Param('id') id: string) {
    return this.jobPostingsService.getSuggestedCandidates(id);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(
    @Query() query: FilterJobPostingDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.jobPostingsService.findAll(query, userId);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id') id: string, 
    @CurrentUser('userId') userId?: string,
    @Query('trackView') trackView?: string
  ) {
    const shouldTrack = trackView !== 'false';
    return this.jobPostingsService.findOne(id, userId, shouldTrack);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateJobPostingDto: UpdateJobPostingDto,
  ) {
    return this.jobPostingsService.update(id, updateJobPostingDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobPostingsService.remove(id);
  }
}
