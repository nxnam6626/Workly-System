import { IsOptional, IsEnum, IsNumber, IsString } from 'class-validator';
import { JobStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class AdminFilterJobPostingDto {
  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAiScore?: number;

  @IsOptional()
  @IsString()
  searchTerm?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;
}
