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
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findAllForMe(@CurrentUser('userId') userId: string) {
    return this.applicationsService.findAllForUser(userId);
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/cvs',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  async create(
    @UploadedFile() file: any,
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.applicationsService.create(createApplicationDto, file, userId);
  }

  @Get('job/:id')
  async findByJob(@Param('id') id: string) {
    return this.applicationsService.findAllByJob(id);
  }

  @Get('recruiter')
  @UseGuards(JwtAuthGuard)
  async findAllForRecruiter(@CurrentUser('userId') userId: string) {
    return this.applicationsService.findAllForRecruiter(userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: any,
  ) {
    return this.applicationsService.updateStatus(id, status);
  }
  
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.applicationsService.remove(id, userId);
  }
}
