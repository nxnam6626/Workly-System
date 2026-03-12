import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateJobPostingDto {
  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Mô tả công việc không được để trống' })
  description: string;

  @IsUUID()
  @IsNotEmpty()
  recruiterId: string;

  @IsUUID()
  @IsNotEmpty()
  companyId: string;

  @IsString()
  @IsOptional()
  jobType?: string;

  @IsString()
  @IsOptional()
  locationCity?: string;

  @IsNumber()
  @IsOptional()
  status?: number;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsUUID()
  @IsNotEmpty({ message: 'AdminID không được để trống' })
  adminId: string;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  benefits?: string;
}
