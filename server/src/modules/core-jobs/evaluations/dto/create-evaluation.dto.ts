import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CriterionScoreDto {
  @IsString()
  name: string;

  @IsInt()
  @Min(0)
  @Max(5)
  score: number;

  @IsInt()
  @Min(1)
  @Max(10)
  maxScore: number;
}

export class CreateEvaluationDto {
  @IsString()
  applicationId: string;

  @IsInt()
  @IsOptional()
  roundNumber?: number;

  @IsString()
  @IsOptional()
  roundName?: string;

  @IsString()
  @IsOptional()
  sessionDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterionScoreDto)
  criteriaScores: CriterionScoreDto[];

  @IsInt()
  @Min(0)
  @Max(5)
  @IsOptional()
  overallRating?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  result?: 'PENDING' | 'PASS' | 'FAIL';
}
