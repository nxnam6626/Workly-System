import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('candidates')
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
  ) { }

  @Post('cv/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
  }))
  async uploadCv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp CV (PDF).');
    }

    return this.candidatesService.uploadCvOnly(userId, file);
  }

  @Post('cv/:cvId/analyze')
  @UseGuards(JwtAuthGuard)
  async analyzeCv(
    @Param('cvId') cvId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.candidatesService.analyzeCv(userId, cvId);
  }

  @Post('cv/extract')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
  }))
  async extractCv(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('userId') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp CV (PDF).');
    }

    // Luồng Onboarding: Tự động xóa file nếu phân tích thất bại để tránh rác dữ liệu
    const cv = await this.candidatesService.uploadCvOnly(userId, file);

    try {
      const result = await this.candidatesService.analyzeCv(userId, cv.cvId) as any;

      if (!result || !result.parsedData) {
        await this.candidatesService.deleteCv(userId, cv.cvId);
        throw new BadRequestException('AI không thể bóc tách dữ liệu từ CV này. Vui lòng tải lên tệp khác hoặc thử lại.');
      }

      return result;
    } catch (error) {
      // Dọn dẹp nếu có lỗi bất kỳ (AI timeout, lỗi mạng, v.v.)
      await this.candidatesService.deleteCv(userId, cv.cvId);
      
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Quá trình phân tích CV gặp lỗi. Vui lòng thử lại.');
    }
  }

  @Patch('cv/:cvId')
  @UseGuards(JwtAuthGuard)
  async updateCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
    @Body() updateCvDto: any,
  ) {
    return this.candidatesService.updateCv(userId, cvId, updateCvDto);
  }

  @Post('cv')
  @UseGuards(JwtAuthGuard)
  async saveCv(@CurrentUser('userId') userId: string, @Body() saveCvDto: any) {
    return this.candidatesService.saveCv(userId, saveCvDto);
  }

  @Patch('cv/:cvId/set-main')
  @UseGuards(JwtAuthGuard)
  async setMainCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
  ) {
    return this.candidatesService.setMainCv(userId, cvId);
  }

  @Delete('cv/:cvId')
  @UseGuards(JwtAuthGuard)
  async deleteCv(
    @CurrentUser('userId') userId: string,
    @Param('cvId') cvId: string,
  ) {
    return this.candidatesService.deleteCv(userId, cvId);
  }

  @Post()
  create(@Body() createCandidateDto: any) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string) {
    return this.candidatesService.findByUserId(userId);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  getSavedCandidates(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getSavedCandidates(userId);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.candidatesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.candidatesService.findOne(id);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  toggleSave(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.candidatesService.toggleSave(id, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCandidateDto: any) {
    return this.candidatesService.update(id, updateCandidateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
