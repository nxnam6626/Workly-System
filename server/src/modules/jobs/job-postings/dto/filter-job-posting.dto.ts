import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { JobType, JobTier } from '@/generated/prisma';

export class FilterJobPostingDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(JobType)
  jobType?: JobType;

  @IsOptional()
  @IsEnum(JobTier)
  jobTier?: JobTier;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  experience?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  salaryMax?: number;

  @IsOptional()
  @IsString()
  rank?: string;

  @IsOptional()
  @IsString()
  education?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'suitable';
}
