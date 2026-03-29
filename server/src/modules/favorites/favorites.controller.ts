import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post('toggle/:jobPostingId')
  @UseGuards(JwtAuthGuard)
  async toggle(
    @Param('jobPostingId') jobPostingId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.favoritesService.toggle(jobPostingId, userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findAllForMe(@CurrentUser('userId') userId: string) {
    return this.favoritesService.findAllForUser(userId);
  }
}
