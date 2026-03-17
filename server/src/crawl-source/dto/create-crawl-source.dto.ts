import { IsString, IsUrl, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCrawlSourceDto {
  @ApiProperty({ description: 'Name of the job source platform' })
  @IsString()
  @IsNotEmpty()
  sourceName: string;

  @ApiProperty({ description: 'Base URL for crawling' })
  @IsUrl()
  @IsNotEmpty()
  baseUrl: string;

  @ApiPropertyOptional({ description: 'Is active for scheduled crawling' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

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

  @ApiProperty({ description: 'Cron expression for scheduling' })
  @IsString()
  @IsNotEmpty()
  schedule: string;

  @ApiPropertyOptional({ description: 'Use Puppeteer to render JS' })
  @IsBoolean()
  @IsOptional()
  renderJs?: boolean;
}
