import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class JobDto {
  @ApiProperty({ description: 'Tiêu đề công việc' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Tên công ty' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ description: 'Mô tả công việc' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Link ứng tuyển' })
  @IsUrl()
  @IsNotEmpty()
  applyUrl: string;

  @ApiProperty({ description: 'Mức lương', default: 'Thỏa thuận' })
  @IsString()
  @IsOptional()
  salary: string;
}
