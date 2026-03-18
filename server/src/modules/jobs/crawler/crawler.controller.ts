import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CrawlerService, CrawlPreviewRequest } from './crawler.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { IsString, IsUrl, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class TestCrawlDto implements CrawlPreviewRequest {
  @ApiProperty({ description: 'Base URL for crawling' })
  @IsUrl()
  @IsNotEmpty()
  baseUrl: string;

  @ApiProperty({ description: 'CSS Selector or XPath for Job Title' })
  @IsString()
  @IsNotEmpty()
  titleSelector: string;

  @ApiPropertyOptional({ description: 'CSS Selector or XPath for Job Salary' })
  @IsString()
  @IsOptional()
  salarySelector?: string;

  @ApiProperty({ description: 'CSS Selector or XPath for Job Description' })
  @IsString()
  @IsNotEmpty()
  descriptionSelector: string;

  @ApiPropertyOptional({ description: 'Use Puppeteer to render JS' })
  @IsBoolean()
  @IsOptional()
  renderJs?: boolean;
}

@ApiTags('Admin Crawler Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/crawler')
export class CrawlerController {
  constructor(private readonly crawlerService: CrawlerService) {}

  @Post('test-crawl')
  @ApiOperation({ summary: 'Preview crawled data from a given URL and selectors' })
  async testCrawl(@Body() testCrawlDto: TestCrawlDto) {
    return this.crawlerService.testCrawl(testCrawlDto);
  }
}
