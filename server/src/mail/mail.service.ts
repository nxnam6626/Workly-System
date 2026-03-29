import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendWelcomeEmail(email: string, name: string) {
    try {
      await this.resend.emails.send({
        from: 'Workly <onboarding@resend.dev>', // resend.dev is allowed for testing
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
      // Capture the error object returned by Resend
      const { data, error } = await this.resend.emails.send({
        from: 'Workly <onboarding@resend.dev>',
        to: email,
        subject: 'Khôi phục mật khẩu Workly',
        html: `<p>Mã xác nhận để đổi mật khẩu của bạn là: <strong>${token}</strong></p><p>Mã này sẽ hết hạn trong vòng 15 phút.</p>`,
      });

      if (error) {
        console.error('[MailService] Resend API Error:', error);
        return;
      }
      console.log(`[MailService] Password reset email sent to ${email}. ID: ${data?.id}`);
    } catch (error) {
      console.error('[MailService] Error sending password reset email:', error);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const verificationLink = `${frontendUrl}/verify-email?email=${email}`;
      const { data, error } = await this.resend.emails.send({
        from: 'Workly <onboarding@resend.dev>',
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

      if (error) {
        console.error('[MailService] Resend API Error:', error);
        return;
      }
      console.log(`[MailService] Verification email sent to ${email}. ID: ${data?.id}`);
    } catch (error) {
      console.error('[MailService] Error sending verification email:', error);
    }
  }
}
