import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsOptional, IsNumber, IsArray } from 'class-validator';

export class JobDto {
  @ApiProperty({ description: 'Tiêu đề công việc' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Tên công ty' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsOptional()
  @IsUrl()
  companyLogo?: string;

  @ApiProperty({ description: 'Mô tả công việc' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Yêu cầu công việc (Qualifications)' })
  @IsString()
  @IsOptional()
  requirements?: string;

  @ApiProperty({ description: 'Quyền lợi (Benefits)' })
  @IsString()
  @IsOptional()
  benefits?: string;

  @ApiProperty({ description: 'Link gốc/ứng tuyển' })
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;

  @ApiProperty({ description: 'Thành phố' })
  @IsString()
  @IsOptional()
  locationCity?: string;

  @ApiProperty({ description: 'Lương tối thiểu' })
  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @ApiProperty({ description: 'Lương tối đa' })
  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @ApiProperty({ description: 'Loại tiền tệ', default: 'VND' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Nhãn ngành nghề' })
  @IsString()
  @IsOptional()
  industry?: string;
}