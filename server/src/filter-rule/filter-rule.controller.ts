import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { FilterRuleService } from './filter-rule.service';
import { CreateFilterRuleDto } from './dto/create-filter-rule.dto';
import { UpdateFilterRuleDto } from './dto/update-filter-rule.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Admin Filter Rules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/filter-rules')
export class FilterRuleController {
  constructor(private readonly filterRuleService: FilterRuleService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a filter rule by ID' })
  findOne(@Param('id') id: string) {
    return this.filterRuleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a filter rule' })
  update(@Param('id') id: string, @Body() updateDto: UpdateFilterRuleDto) {
    return this.filterRuleService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a filter rule by ID' })
  remove(@Param('id') id: string) {
    return this.filterRuleService.remove(id);
  }
}

@ApiTags('Admin Filter Rules (Nested)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/crawl-sources/:sourceId/filter-rules')
export class FilterRuleNestedController {
  constructor(private readonly filterRuleService: FilterRuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new filter rule for a crawl source' })
  create(
    @CurrentUser('userId') userId: string,
    @Param('sourceId') sourceId: string,
    @Body() createDto: CreateFilterRuleDto
  ) {
    return this.filterRuleService.create(userId, sourceId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all filter rules for a specific crawl source' })
  findAllBySource(@Param('sourceId') sourceId: string) {
    return this.filterRuleService.findAllBySource(sourceId);
  }
}
