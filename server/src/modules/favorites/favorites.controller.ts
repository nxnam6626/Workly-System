import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('favorites')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle/:jobPostingId')
  async toggle(
    @Param('jobPostingId') jobPostingId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.favoritesService.toggle(jobPostingId, userId);
  }

  @Get('me')
  async findAllForMe(@CurrentUser('userId') userId: string) {
    return this.favoritesService.findAllForUser(userId);
  }
}
