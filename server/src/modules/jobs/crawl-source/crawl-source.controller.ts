import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CrawlSourceService } from './crawl-source.service';
import { CreateCrawlSourceDto } from './dto/create-crawl-source.dto';
import { UpdateCrawlSourceDto } from './dto/update-crawl-source.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Crawl Sources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/crawl-sources')
export class CrawlSourceController {
  constructor(private readonly crawlSourceService: CrawlSourceService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new crawl source with configuration' })
  create(@CurrentUser('userId') userId: string, @Body() createDto: CreateCrawlSourceDto) {
    return this.crawlSourceService.create(userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all crawl sources' })
  findAll() {
    return this.crawlSourceService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get crawl source by ID' })
  findOne(@Param('id') id: string) {
    return this.crawlSourceService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update crawl source and/or its configuration' })
  update(@Param('id') id: string, @Body() updateDto: UpdateCrawlSourceDto) {
    return this.crawlSourceService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crawl source and its config' })
  remove(@Param('id') id: string) {
    return this.crawlSourceService.remove(id);
  }
}

@ApiTags('Admin Crawl Logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/crawl-logs')
export class CrawlLogController {
  constructor(private readonly crawlSourceService: CrawlSourceService) {}

  @Get()
  @ApiOperation({ summary: 'Get recent crawl logs' })
  getLogs(@Query('sourceId') sourceId?: string) {
    return this.crawlSourceService.getLogs(sourceId);
  }
}
