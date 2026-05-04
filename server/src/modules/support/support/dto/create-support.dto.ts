import { IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';

export class CreateSupportDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsEmail({}, { message: 'Email không hợp lệ.' })
  email: string;

  @IsString()
  @MaxLength(200)
  subject: string;

  @IsString()
  @MaxLength(2000)
  message: string;
}
