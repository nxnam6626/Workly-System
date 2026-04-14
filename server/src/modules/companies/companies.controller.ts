import {
  Controller,
  Get,
  Param,
  Query,
  Patch,
  Body,
  UseGuards,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CompaniesService } from './companies.service';
import { FilterCompanyDto } from './dto/filter-company.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('my-company')
  @UseGuards(JwtAuthGuard)
  getMyCompany(@CurrentUser('userId') userId: string) {
    return this.companiesService.getMyCompany(userId);
  }

  @Patch('my-company')
  @UseGuards(JwtAuthGuard)
  updateMyCompany(
    @CurrentUser('userId') userId: string,
    @Body() updateData: any,
  ) {
    return this.companiesService.updateMyCompany(userId, updateData);
  }

  @Patch('my-company/logo')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadLogo(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Vui lòng tải lên ảnh logo.');
    return this.companiesService.uploadLogo(userId, file);
  }

  @Patch('my-company/banner')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadBanner(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Vui lòng tải lên ảnh banner.');
    return this.companiesService.uploadBanner(userId, file);
  }

  @Post('my-company/branches')
  @UseGuards(JwtAuthGuard)
  addBranch(
    @CurrentUser('userId') userId: string,
    @Body() body: { name: string; address: string },
  ) {
    return this.companiesService.addBranch(userId, body);
  }

  @Delete('my-company/branches/:branchId')
  @UseGuards(JwtAuthGuard)
  deleteBranch(
    @CurrentUser('userId') userId: string,
    @Param('branchId') branchId: string,
  ) {
    return this.companiesService.deleteBranch(userId, branchId);
  }

  @Get()
  findAll(@Query() query: FilterCompanyDto) {
    return this.companiesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }
}
