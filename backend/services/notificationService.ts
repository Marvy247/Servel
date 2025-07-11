import nodemailer from 'nodemailer';
import axios from 'axios';

interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  webhook: boolean;
  webhookUrl?: string;
  emailAddress?: string;
}

class NotificationService {
  private transporter;

  constructor() {
    // Configure nodemailer transporter for email notifications
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmailNotification(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to,
        subject,
        text,
      });
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  }

  async sendWebhookNotification(url: string, payload: any) {
    try {
      await axios.post(url, payload);
    } catch (error) {
      console.error('Error sending webhook notification:', error);
    }
  }

  async sendInAppNotification(userId: string, message: string) {
    // Placeholder for in-app notification logic
    // This could be implemented using websockets or push notifications
    console.log(`In-app notification to user ${userId}: ${message}`);
  }

  async notifyUser(
    userId: string,
    preferences: NotificationPreferences,
    subject: string,
    message: string,
    webhookPayload?: any
  ) {
    if (preferences.email && preferences.emailAddress) {
      await this.sendEmailNotification(preferences.emailAddress, subject, message);
    }
    if (preferences.webhook && preferences.webhookUrl && webhookPayload) {
      await this.sendWebhookNotification(preferences.webhookUrl, webhookPayload);
    }
    if (preferences.inApp) {
      await this.sendInAppNotification(userId, message);
    }
  }
}

export const notificationService = new NotificationService();
