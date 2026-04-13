import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../auth/decorators/roles.decorator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email đăng ký' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyen Van A', description: 'Họ tên' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @ApiProperty({
    enum: ['CANDIDATE', 'RECRUITER', 'ADMIN'],
    example: 'CANDIDATE',
    description: 'Vai trò: CANDIDATE | RECRUITER | ADMIN',
  })
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role: Role;

  @ApiProperty({ required: false })
  companyName?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  location?: string;

  @ApiProperty({ required: false })
  taxCode?: string;

  @ApiProperty({ required: false })
  verifyStatus?: number;
}
