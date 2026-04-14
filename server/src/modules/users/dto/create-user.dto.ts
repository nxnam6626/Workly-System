import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  IsArray,
  IsOptional,
} from 'class-validator';
import { Role } from '../../auth/decorators/roles.decorator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role: Role;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];
}
