import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // upgrade later with STARTTLS
      auth: {
        user: process.env.MAIL_USER,
        // Sanitize password by removing all whitespace (common when copy-pasting App Passwords)
        pass: process.env.MAIL_PASS?.replace(/\s/g, ''),
      },
    });

    // Tự động kiểm tra kết nối ngay khi Server khởi động
    this.transporter.verify((error, success) => {
      if (error) {
        console.error(
          '[MailService] ❌ Nodemailer connection failed:',
          error.message,
        );
        console.warn(
          '[MailService] ⚠️ Vui lòng kiểm tra MAIL_USER và MAIL_PASS trong file .env',
        );
      } else {
        console.log(
          '[MailService] ✅ Nodemailer is ready to take our messages',
        );
      }
    });
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.transporter.sendMail({
        from: `"Workly" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Welcome to Workly!',
        html: `<p>Hi ${name || 'there'},</p><p>Welcome to Workly! We are excited to have you on board.</p>`,
      });
      console.log(`[MailService] Welcome email sent to ${email}`);
    } catch (error) {
      console.error('[MailService] Error sending welcome email:', error);
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    try {
      await this.transporter.sendMail({
        from: `"Workly" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Khôi phục mật khẩu Workly',
        html: `<p>Mã xác nhận để đổi mật khẩu của bạn là: <strong>${token}</strong></p><p>Mã này sẽ hết hạn trong vòng 15 phút.</p>`,
      });
      console.log(`[MailService] Password reset email sent to ${email}`);
    } catch (error) {
      console.error('[MailService] Error sending password reset email:', error);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationLink = `${frontendUrl}/verify-email?email=${email}&token=${token}`;

      await this.transporter.sendMail({
        from: `"Workly" <${process.env.MAIL_USER}>`,
        to: email,
        subject: 'Xác minh Email cho tài khoản Workly',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155;">
            <h2 style="color: #2563eb;">Xác minh tài khoản Workly</h2>
            <p>Chào bạn,</p>
            <p>Mã xác nhận để xác minh email của bạn là:</p>
            <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: bold; text-align: center; color: #0f172a; margin: 20px 0; letter-spacing: 8px;">
              ${token}
            </div>
            <p>Vui lòng nhập mã này vào trang xác minh hoặc nhấn vào nút bên dưới:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background: #2563eb; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">Xác minh ngay</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Mã này sẽ hết hạn trong vòng 15 phút. Nếu bạn không yêu cầu xác minh này, vui lòng bỏ qua email.</p>
          </div>
        `,
      });
      console.log(`[MailService] Verification email sent to ${email}`);
    } catch (error) {
      console.error('[MailService] Error sending verification email:', error);
    }
  }

  async sendJobInvitation(
    email: string,
    candidateName: string,
    companyName: string,
    messageContent: string,
  ) {
    try {
      await this.transporter.sendMail({
        from: `"Workly - ${companyName}" <${process.env.MAIL_USER}>`,
        to: email,
        subject: `[Workly] Lời mời cơ hội việc làm từ ${companyName}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #334155; line-height: 1.6;">
            <p>Chào <strong>${candidateName}</strong>,</p>
            <p>Nhà tuyển dụng <strong>${companyName}</strong> đã xem qua hồ sơ của bạn trên hệ thống Workly và rất ấn tượng. Họ đã gửi một thông điệp dành cho bạn:</p>
            <div style="background: #f1f5f9; padding: 15px 20px; border-left: 4px solid #2563eb; border-radius: 8px; margin: 20px 0; font-style: italic;">
              "${messageContent}"
            </div>
            <p>Vui lòng đăng nhập vào hệ thống Workly để phản hồi lại nhà tuyển dụng qua hệ thống nhắn tin nội bộ.</p>
            <div style="margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/candidate/messages" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Xem tin nhắn</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">Trân trọng,<br>Đội ngũ Workly</p>
          </div>
        `,
      });
      console.log(`[MailService] Job invitation email sent to ${email}`);
    } catch (error) {
      console.error('[MailService] Error sending job invitation email:', error);
    }
  }
}
