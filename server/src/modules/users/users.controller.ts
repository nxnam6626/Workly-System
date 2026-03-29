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
} from '@nestjs/common';
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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('role') role?: Role,
    @Query('status') status?: 'ACTIVE' | 'LOCKED',
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
  lock(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.lockUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':userId/unlock')
  unlock(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.unlockUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':userId')
  remove(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.usersService.remove(userId);
  }
}
