import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator';
import { EvaluationsService } from './evaluations.service';
import { CreateEvaluationDto } from './dto/create-evaluation.dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Role, Roles } from '@/common/decorators/roles.decorator';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Post()
  upsert(@Body() dto: CreateEvaluationDto, @Req() req: any) {
    return this.evaluationsService.upsert(dto, req.user.userId);
  }

  @Post('schedule-next-round')
  scheduleNextRound(@Body() dto: any, @Req() req: any) {
    return this.evaluationsService.scheduleNextRound(dto, req.user.userId);
  }

  /** GET /evaluations/all-sessions — All sessions across all recruiter's jobs */
  @Get('all-sessions')
  getAllSessions(@Req() req: any) {
    return this.evaluationsService.getAllSessions(req.user.userId);
  }

  @Get('debug')
  async debugSessions(@Query('userId') userId: string) {
    return this.evaluationsService.getAllSessions(userId || '521ce621-e8bb-4c26-8051-789f21f1d154');
  }

  @Public()
  @Get('create-test-user')
  async createTestUser() {
    // Call the prisma service through an injected service, but since we are in a controller, 
    // it's easier to just do it via evaluationsService or manually via a temporary function.
    // I will write this inside evaluations.service.ts instead and call it from here.
    return this.evaluationsService.createTestUser();
  }

  /** GET /evaluations/sessions?jobId=xxx — Sessions grouped by date for a job */
  @Get('sessions')
  getSessions(@Query('jobId') jobId: string, @Req() req: any) {
    return this.evaluationsService.getSessionsForJob(jobId, req.user.userId);
  }

  /** GET /evaluations/application/:appId — All evaluations for an application */
  @Get('application/:appId')
  findByApplication(@Param('appId') appId: string, @Req() req: any) {
    return this.evaluationsService.findByApplication(appId, req.user.userId);
  }

  /** DELETE /evaluations/:id */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.evaluationsService.remove(id, req.user.userId);
  }
}
