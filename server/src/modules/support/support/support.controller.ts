import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { OptionalJwtAuthGuard } from '@/common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles, Role } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserPayload } from '@/common/decorators/current-user.decorator';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('contact')
  @UseGuards(OptionalJwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async contactSupport(
    @Body() createSupportDto: CreateSupportDto,
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const request = await this.supportService.createSupportRequest(
      createSupportDto,
      user?.userId,
      file,
    );
    return {
      message:
        'Yêu cầu hỗ trợ của bạn đã được gửi. Chúng tôi sẽ phản hồi sớm nhất.',
      requestId: request.requestId,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async getAllRequests() {
    return this.supportService.getAllRequests();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED',
  ) {
    return this.supportService.updateStatus(id, status);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async replySupportRequest(
    @Param('id') id: string,
    @Body('message') message: string,
  ) {
    return this.supportService.replyToSupportRequest(id, message);
  }
}
