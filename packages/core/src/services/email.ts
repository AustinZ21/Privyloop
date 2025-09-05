/**
 * Email service for PrivyLoop authentication
 * Supports dual deployment: self-hosted (Nodemailer) and enterprise (Resend)
 */

import nodemailer from 'nodemailer';

interface EmailConfig {
  deployment: 'self-hosted' | 'enterprise';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  from: {
    name: string;
    address: string;
  };
}

interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private config: EmailConfig;
  private transporter?: nodemailer.Transporter;

  constructor() {
    this.config = this.getEmailConfig();
    if (this.config.deployment === 'self-hosted') {
      this.setupNodemailer();
    }
  }

  private getEmailConfig(): EmailConfig {
    const isEnterprise = process.env.DEPLOYMENT_MODE === 'enterprise';
    
    if (isEnterprise) {
      return {
        deployment: 'enterprise',
        from: {
          name: 'PrivyLoop',
          address: process.env.FROM_EMAIL || 'noreply@privyloop.com',
        },
      };
    }

    return {
      deployment: 'self-hosted',
      smtp: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      },
      from: {
        name: process.env.FROM_NAME || 'PrivyLoop',
        address: process.env.FROM_EMAIL || 'noreply@localhost',
      },
    };
  }

  private setupNodemailer(): void {
    if (!this.config.smtp) {
      throw new Error('SMTP configuration required for self-hosted deployment');
    }

    this.transporter = nodemailer.createTransport({
      host: this.config.smtp.host,
      port: this.config.smtp.port,
      secure: this.config.smtp.secure,
      auth: this.config.smtp.auth,
    });
  }

  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      if (this.config.deployment === 'enterprise') {
        return await this.sendWithResend(data);
      } else {
        return await this.sendWithNodemailer(data);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  private async sendWithNodemailer(data: EmailData): Promise<boolean> {
    if (!this.transporter) {
      throw new Error('Nodemailer transporter not initialized');
    }

    const mailOptions = {
      from: `${this.config.from.name} <${this.config.from.address}>`,
      to: data.to,
      subject: data.subject,
      html: data.html,
      text: data.text || this.stripHtml(data.html),
    };

    const result = await this.transporter.sendMail(mailOptions);
    return !!result.messageId;
  }

  private async sendWithResend(data: EmailData): Promise<boolean> {
    // This will be implemented when enterprise package is added
    // For now, fallback to nodemailer if available or log
    if (this.transporter) {
      return await this.sendWithNodemailer(data);
    }
    
    console.log('Enterprise email sending not yet implemented, logging email:');
    console.log(`To: ${data.to}`);
    console.log(`Subject: ${data.subject}`);
    console.log(`Body: ${data.text || this.stripHtml(data.html)}`);
    return true;
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }

  async sendVerificationEmail(email: string, verificationUrl: string): Promise<boolean> {
    const subject = 'Verify your PrivyLoop account';
    const html = this.getVerificationEmailTemplate(verificationUrl);
    
    return await this.sendEmail({
      to: email,
      subject,
      html,
    });
  }

  private getVerificationEmailTemplate(verificationUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Verify your PrivyLoop account</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #10b981; margin: 0; font-size: 24px;">PrivyLoop</h1>
                    <p style="color: #64748b; margin: 8px 0 0 0;">Privacy Made Simple</p>
                </div>
                
                <h2 style="color: #1e293b; font-size: 20px; margin-bottom: 16px;">Verify your account</h2>
                
                <p style="color: #475569; line-height: 1.6; margin-bottom: 24px;">
                    Welcome to PrivyLoop! Click the button below to verify your email address and complete your account setup.
                </p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${verificationUrl}" style="display: inline-block; background-color: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                    If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #10b981; font-size: 14px; word-break: break-all; margin-bottom: 24px;">
                    ${verificationUrl}
                </p>
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
                
                <p style="color: #64748b; font-size: 12px; line-height: 1.5; margin: 0;">
                    This verification link will expire in 24 hours. If you didn't create a PrivyLoop account, you can safely ignore this email.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} PrivyLoop. Privacy Made Simple.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export for testing
export { EmailService };