import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { Role, Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

// ─── Routes NOT requiring ADMIN ───────────────────────────────────────────────
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** Lấy thông tin bản thân (bất kỳ user nào đã đăng nhập). */
  @Get('me')
  getMe(@CurrentUser('userId') userId: string) {
    return this.usersService.getMe(userId);
  }

  /** Cập nhật ảnh đại diện. */
  @Patch('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  updateAvatar(
    @CurrentUser('userId') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng tải lên tệp ảnh.');
    }
    return this.usersService.updateAvatar(userId, file);
  }

  @Get('test-me-debug')
  async testMeDebug() {
    const firstUser = await this.usersService['prisma'].user.findFirst();
    if (!firstUser) return 'No user';
    return this.usersService.getMe(firstUser.userId);
  }

  /** Cập nhật hồ sơ ứng viên (dành cho CANDIDATE). */
  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateCandidateProfileDto,
  ) {
    return this.usersService.updateCandidateProfile(userId, dto);
  }

  // ─── Admin-only routes below ───────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser('userId') reqUserId: string,
  ) {
    if (createUserDto.role === Role.ADMIN) {
      const currentUser = await this.usersService.findOne(reqUserId);
      const isSupreme = currentUser.admin?.permissions.includes('SUPER_ADMIN') || currentUser.admin?.permissions.includes('ALL');
      if (!isSupreme) {
        throw new ForbiddenException(
          'Chỉ Quản trị viên Toàn quyền mới được phép tạo Admin mới.',
        );
      }
    }
    return this.usersService.create(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('role') role?: Role,
    @Query('status') status?: 'ACTIVE' | 'LOCKED' | 'BANNED',
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({
      skip: skip != null ? Number(skip) : undefined,
      take: take != null ? Number(take) : undefined,
      role,
      status,
      search,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get(':userId')
  findOne(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.findOne(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId')
  update(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/lock')
  lock(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('userId') reqUserId: string,
  ) {
    return this.usersService.lockUser(userId, reqUserId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/unlock')
  unlock(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.unlockUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/unlock-probation')
  unlockProbation(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.unlockWithProbation(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/ban')
  ban(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.banUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/reset-violations')
  resetViolations(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.resetViolationCount(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':userId')
  remove(
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser('userId') reqUserId: string,
  ) {
    return this.usersService.remove(userId, reqUserId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/admin-permissions')
  updateAdminPermissions(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body('permissions') permissions: string[],
    @Body('fullName') fullName?: string,
  ) {
    return this.usersService.updateAdminPermissions(userId, permissions || [], fullName);
  }
}
