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
}
