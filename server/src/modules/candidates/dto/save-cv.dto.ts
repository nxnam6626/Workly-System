import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import type { CvParsedData } from '../interfaces/cv-parsing.interface';

export class SaveCvDto {
  @IsString()
  @IsNotEmpty()
  cvTitle: string;

  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;

  @IsNotEmpty()
  parsedData: CvParsedData;
}
