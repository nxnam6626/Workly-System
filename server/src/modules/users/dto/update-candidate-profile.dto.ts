import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsArray,
} from 'class-validator';

export class UpdateCandidateProfileDto {
  @IsString()
  fullName: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  university?: string;

  @IsOptional()
  @IsString()
  major?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4)
  gpa?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];
}
