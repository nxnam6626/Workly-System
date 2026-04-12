import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CandidatesService } from './candidates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming there's auth
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('candidates')
//@UseGuards(JwtAuthGuard) // Can apply this if needed
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  create(@Body() createCandidateDto: any) {
    return this.candidatesService.create(createCandidateDto);
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  getSavedCandidates(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getSavedCandidates(userId);
  }

  @Get('recommended-jobs')
  @UseGuards(JwtAuthGuard)
  getRecommendedJobs(@CurrentUser('userId') userId: string) {
    return this.candidatesService.getRecommendedJobs(userId);
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
