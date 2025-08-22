import { Controller } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { EventPattern, Payload } from '@nestjs/microservices';

@Controller('notification')
export class NotificationController {
  constructor(private readonly mailerService: MailerService) {}

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    await this.sendOtpMail(data);
  }

  @EventPattern('otp_resend')
  async handleOtpResend(@Payload() data: any) {
    await this.sendOtpMail(data);
  }

  private async sendOtpMail(data: any) {
    await this.mailerService.sendMail({
      to: data.email,
      subject: 'Account Activation',
      text: `Your verification code is: ${data.otp}`,
      html: `<p>Hello ${data.name},</p>
           <p>Your verification code is: <b>${data.otp}</b></p>
           <p>This code will expire in 5 minutes.</p>`,
    });
  }
}
