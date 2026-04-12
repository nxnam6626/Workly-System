import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  UseGuards,
  Headers,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { SecurityService } from './security.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly securityService: SecurityService,
  ) { }

  // ==========================================
  // CORE AUTHENTICATION (Xác thực chính)
  // ==========================================

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc email đã tồn tại',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập truyền thống' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Đăng xuất khỏi hệ thống' })
  logout(@CurrentUser('userId') userId: string) {
    return this.authService.logout(userId);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới Access Token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.tokenService.refreshTokens(dto.refreshToken);
  }

  /** Kiểm tra token: gửi Bearer token trong header Authorization. */
  @Public()
  @Get('validate')
  @ApiOperation({ summary: 'Kiểm tra tính hợp lệ của Token' })
  validate(@Headers('authorization') authorization: string | undefined) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim() ?? '';
    return this.tokenService.validateToken(token);
  }

  // ==========================================
  // SOCIAL AUTHENTICATION (Mạng xã hội)
  // ==========================================

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Chuyển hướng đăng nhập bằng Google' })
  async googleAuth(@Req() req: Request) {
    // Redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Xử lý callback từ Google' })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/callback?token=${result.accessToken}&refresh_token=${result.refreshToken}`);
  }

  @Public()
  @Get('linkedin')
  @UseGuards(AuthGuard('linkedin'))
  @ApiOperation({ summary: 'Chuyển hướng đăng nhập bằng LinkedIn' })
  async linkedinAuth(@Req() req: Request) {
    // Redirects to LinkedIn
  }

  @Public()
  @Get('linkedin/callback')
  @UseGuards(AuthGuard('linkedin'))
  @ApiOperation({ summary: 'Xử lý callback từ LinkedIn' })
  async linkedinAuthCallback(@Req() req: Request, @Res() res: Response) {
    const result = await this.authService.oauthLogin(req.user);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/callback?token=${result.accessToken}&refresh_token=${result.refreshToken}`);
  }

  // ==========================================
  // PASSWORD MANAGEMENT (Quản lý Mật khẩu)
  // ==========================================

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.securityService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Xác nhận đặt lại mật khẩu bằng mã OTP' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.securityService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('change-password')
  @ApiOperation({ summary: 'Đổi mật khẩu khi đã đăng nhập' })
  changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.securityService.changePassword(userId, dto.currentPassword, dto.newPassword);
  }

  // ==========================================
  // EMAIL VERIFICATION (Xác minh Email)
  // ==========================================

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('send-verification-email')
  @ApiOperation({ summary: 'Gửi mã xác minh tới email' })
  sendVerificationEmail(@CurrentUser('userId') userId: string) {
    return this.securityService.sendEmailVerification(userId);
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Xác minh email với mã OTP' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.securityService.verifyEmail(dto);
  }
}
