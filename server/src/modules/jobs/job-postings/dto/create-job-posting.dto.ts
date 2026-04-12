import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { JobType } from '@prisma/client';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả công việc không được để trống' })
  description: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(JobType, { message: 'Loại công việc không hợp lệ' })
  @IsOptional()
  jobType?: JobType;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsNumber()
  @IsOptional()
  vacancies?: number;

  @IsString()
  @IsOptional()
  locationCity?: string;

  @IsNumber()
  @IsOptional()
  deadline?: number;

  @IsOptional()
  hardSkills?: string[];

  @IsOptional()
  softSkills?: string[];

  @IsOptional()
  @IsNumber()
  minExperienceYears?: number;
}
