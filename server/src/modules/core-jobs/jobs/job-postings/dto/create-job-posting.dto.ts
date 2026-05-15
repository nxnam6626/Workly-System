import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { JobType, JobLevel } from '@prisma/client';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả công việc không được để trống' })
  description: string;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  requirements?: string;

  @IsOptional()
  @Transform(({ value }) => (value === null || value === '' ? undefined : value))
  @IsString()
  benefits?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Mức lương tối thiểu không được nhỏ hơn 0' })
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Mức lương tối đa không được nhỏ hơn 0' })
  salaryMax?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEnum(JobType, { message: 'Loại công việc không hợp lệ' })
  @IsOptional()
  jobType?: JobType;

  @IsEnum(JobLevel, { message: 'Chức vụ không hợp lệ' })
  @IsOptional()
  jobLevel?: JobLevel;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsNumber()
  @IsOptional()
  vacancies?: number;

  @IsString()
  @IsOptional()
  locationCity?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branchIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hardSkills?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  softSkills?: string[];

  @IsOptional()
  @IsNumber()
  minExperienceYears?: number;

  @IsOptional()
  @IsEnum(['BASIC', 'PROFESSIONAL', 'URGENT'])
  jobTier?: any;

  @IsOptional()
  autoInviteMatches?: boolean;

  @IsOptional()
  @IsNumber()
  autoRejectThreshold?: number;

  @IsOptional()
  @IsNumber()
  autoInviteThreshold?: number;

  @IsOptional()
  @IsEnum(['STRICT', 'BALANCED', 'BROAD'], { message: 'Mức độ khắt khe không hợp lệ' })
  matchMode?: 'STRICT' | 'BALANCED' | 'BROAD';

  @IsOptional()
  isAiGenerated?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}
