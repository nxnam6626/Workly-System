import { Controller, Post, Body } from '@nestjs/common';
import { DebugService } from './debug.service';

@Controller('debug')
export class DebugController {
  constructor(private readonly debugService: DebugService) {}

  @Post('force-set-subscription')
  async forceSetSubscription(@Body() body: { email: string, plan: string }) {
    return this.debugService.forceSetSubscription(body.email, body.plan);
  }
}
