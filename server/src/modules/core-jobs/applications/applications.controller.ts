import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApplicationsService } from './applications.service';
import { ApplicationInterviewService } from './services/application-interview.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import {
  CurrentUser,
  type CurrentUserPayload,
} from '@/common/decorators/current-user.decorator';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly interviewService: ApplicationInterviewService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findAllForMe(@CurrentUser('userId') userId: string) {
    try {
      return await this.applicationsService.findAllForUser(userId);
    } catch (e) {
      console.error('ERROR IN findAllForMe:', e);
      throw e;
    }
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/cvs',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  async create(
    @UploadedFile() file: any,
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.applicationsService.create(createApplicationDto, file, user);
  }

  @Get('job/:id')
  async findByJob(@Param('id') id: string) {
    return this.applicationsService.findAllByJob(id);
  }

  @Get('kanban/:jobId')
  @UseGuards(JwtAuthGuard)
  async getKanbanApplications(@Param('jobId') jobId: string) {
    return this.applicationsService.getKanbanApplications(jobId);
  }

  @Get('recruiter')
  @UseGuards(JwtAuthGuard)
  async findAllForRecruiter(@CurrentUser('userId') userId: string) {
    return this.applicationsService.findAllForRecruiter(userId);
  }

  @Patch('bulk-status')
  @UseGuards(JwtAuthGuard)
  async updateBulkStatus(
    @CurrentUser('userId') userId: string,
    @Body('applicationIds') applicationIds: string[],
    @Body('status') status: string,
    @Body('interviewDate') interviewDate?: string,
    @Body('interviewTime') interviewTime?: string,
    @Body('interviewLocation') interviewLocation?: string,
  ) {
    return this.applicationsService.updateBulkStatus(
      userId,
      applicationIds,
      status,
      interviewDate,
      interviewTime,
      interviewLocation,
    );
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body('status') status: any,
    @Body('interviewDate') interviewDate?: string,
    @Body('interviewTime') interviewTime?: string,
    @Body('interviewLocation') interviewLocation?: string,
  ) {
    return this.applicationsService.updateStatus(
      id,
      userId,
      status,
      interviewDate,
      interviewTime,
      interviewLocation,
    );
  }

  @Post(':id/unlock')
  @UseGuards(JwtAuthGuard)
  async unlockApplication(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.unlockApplication(id, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.applicationsService.remove(id, userId);
  }

  @Get(':id/available-slots')
  @UseGuards(JwtAuthGuard)
  async getAvailableSlots(@Param('id') id: string) {
    return this.interviewService.getAvailableSlots(id);
  }

  @Post(':id/schedule')
  @UseGuards(JwtAuthGuard)
  async scheduleInterview(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body('date') date: string,
    @Body('time') time: string,
  ) {
    return this.interviewService.candidateScheduleInterview(
      id,
      userId,
      date,
      time,
    );
  }

  @Patch(':id/confirm-interview')
  @UseGuards(JwtAuthGuard)
  async confirmInterview(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.applicationsService.confirmInterview(id, userId);
  }

  @Patch(':id/reschedule-interview')
  @UseGuards(JwtAuthGuard)
  async requestReschedule(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body('proposedDate') proposedDate: string,
    @Body('proposedTime') proposedTime: string,
    @Body('reason') reason: string,
  ) {
    return this.applicationsService.requestReschedule(
      id,
      userId,
      proposedDate,
      proposedTime,
      reason,
    );
  }
}
