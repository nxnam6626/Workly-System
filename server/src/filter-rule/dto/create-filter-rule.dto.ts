import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FilterAction } from '../../generated/prisma';

export class CreateFilterRuleDto {
  @ApiProperty({ description: 'Keyword to filter jobs' })
  @IsString()
  @IsNotEmpty()
  keyword: string;

  @ApiPropertyOptional({ description: 'Minimum reliability score to keep' })
  @IsNumber()
  @IsOptional()
  minReliabilityScore?: number;

  @ApiProperty({ description: 'Action to take when keyword is found', enum: FilterAction })
  @IsEnum(FilterAction)
  @IsNotEmpty()
  action: FilterAction;
}
