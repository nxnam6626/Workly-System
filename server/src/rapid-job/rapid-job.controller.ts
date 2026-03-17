import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RapidJobService } from './rapid-job.service';
import { lastValueFrom } from 'rxjs';
import { JobDto } from './dto/job.dto';

@ApiTags('Rapid Job Test')
@Controller('rapid-job')
export class RapidJobController {
  constructor(private readonly rapidJobService: RapidJobService) {}

  @Get('jsearch')
  @ApiOperation({ summary: 'Test JSearch API' })
  @ApiQuery({ name: 'q', required: true, example: 'intern' })
  @ApiQuery({ name: 'page', required: false, example: '1' })
  @ApiQuery({ name: 'country', required: false, example: 'vn' })
  @ApiQuery({ name: 'date_posted', required: false, example: 'all' })
  async testJSearch(
    @Query('q') q: string,
    @Query('page') page: string = '1',
    @Query('country') country: string = 'vn',
    @Query('date_posted') datePosted: string = 'all',
  ) {
    const response = await lastValueFrom(
      this.rapidJobService.fetchJSearchJobs(
        q,
        parseInt(page),
        country,
        datePosted,
      ),
    );
    return response.data.map((job) => this.rapidJobService.mapJSearchToJob(job));
  }

  @Get('workday')
  @ApiOperation({ summary: 'Test Workday Jobs API' })
  @ApiQuery({ name: 'title', required: true })
  @ApiQuery({ name: 'location', required: false, example: 'Vietnam' })
  async testWorkday(@Query('title') title: string, @Query('location') location: string = 'Vietnam') {
    const data = await lastValueFrom(this.rapidJobService.fetchWorkdayJobs(title, location));
    // Workday API có thể trả về mảng trực tiếp hoặc mảng trong một trường nào đó tùy thuộc vào version
    const items = Array.isArray(data) ? data : (data.items || []);
    return items.map((job) => this.rapidJobService.mapWorkdayToJob(job));
  }
}
