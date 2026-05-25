import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@Controller('candidates')
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('cv/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async uploadCv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp CV (PDF hoặc Word).');
    }

    return this.candidatesService.uploadCvOnly(userId, file);
  }

  @Post('cv/:cvId/analyze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async analyzeCv(
    @Param('cvId') cvId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.candidatesService.analyzeCv(userId, cvId);
  }

  @Post('cv/extract')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async extractCv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp CV (PDF hoặc Word).');
    }

    return this.candidatesService.extractAndAnalyzeCv(userId, file);
  }

  @Patch('cv/:cvId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async updateCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
    @Body() updateCvDto: any,
  ) {
    return this.candidatesService.updateCv(userId, cvId, updateCvDto);
  }

  @Post('cv')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async saveCv(@CurrentUser('userId') userId: string, @Body() saveCvDto: any) {
    return this.candidatesService.saveCv(userId, saveCvDto);
  }

  @Patch('cv/:cvId/set-main')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async setMainCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
  ) {
    return this.candidatesService.setMainCv(userId, cvId);
  }

  @Delete('cv/:cvId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  async deleteCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
  ) {
    return this.candidatesService.deleteCv(userId, cvId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  getSavedCandidates(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getSavedCandidates(userId);
  }

  @Get('recommended-jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getRecommendedJobs(
    @CurrentUser('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.candidatesService.getRecommendedJobs(userId, page, limit);
  }

  @Get('me/invitations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  getMyInvitations(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getMyInvitations(userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query() query: any, @CurrentUser('userId') userId: string) {
    return this.candidatesService.findAll(query, userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.candidatesService.findOne(id, userId);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.RECRUITER)
  toggleSave(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.candidatesService.toggleSave(id, userId);
  }

  @Patch('me/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CANDIDATE)
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateCandidateDto: any,
  ) {
    return this.candidatesService.updateByUserId(userId, updateCandidateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
