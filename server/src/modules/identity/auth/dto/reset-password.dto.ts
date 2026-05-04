import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email tài khoản' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã xác nhận (OTP) được gửi qua email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Mã xác nhận không được để trống' })
  token: string;

  @ApiProperty({
    example: 'newpassword123',
    minLength: 6,
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
  })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
