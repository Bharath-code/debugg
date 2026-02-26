/**
 * Notification Service
 * Email, Slack, and Webhook notifications
 */

import nodemailer from 'nodemailer';
import { logger } from '../lib/logger.js';

export interface NotificationConfig {
  type: 'email' | 'slack' | 'webhook';
  enabled: boolean;
  config: any;
}

export interface NotificationPayload {
  to?: string | string[];
  subject?: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

class NotificationService {
  private emailTransporter: any = null;
  private configs: Map<string, NotificationConfig> = new Map();

  constructor() {
    this.initializeEmail();
  }

  /**
   * Initialize email transporter
   */
  private initializeEmail(): void {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (smtpHost && smtpUser && smtpPass) {
      this.emailTransporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      logger.info('[Notification] Email transporter initialized');
    } else {
      logger.warn('[Notification] Email not configured (SMTP settings missing)');
    }
  }

  /**
   * Register notification configuration
   */
  registerConfig(projectId: string, config: NotificationConfig): void {
    this.configs.set(projectId, config);
    logger.info('[Notification] Config registered', { projectId, type: config.type });
  }

  /**
   * Send notification based on configuration
   */
  async send(projectId: string, payload: NotificationPayload): Promise<boolean> {
    const config = this.configs.get(projectId);

    if (!config || !config.enabled) {
      logger.debug('[Notification] Not enabled', { projectId });
      return false;
    }

    try {
      switch (config.type) {
        case 'email':
          return await this.sendEmail(config.config, payload);
        case 'slack':
          return await this.sendSlack(config.config, payload);
        case 'webhook':
          return await this.sendWebhook(config.config, payload);
        default:
          logger.warn('[Notification] Unknown type', { type: config.type });
          return false;
      }
    } catch (error: any) {
      logger.error('[Notification] Send failed', { 
        projectId, 
        type: config.type, 
        error: error.message 
      });
      return false;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(config: any, payload: NotificationPayload): Promise<boolean> {
    if (!this.emailTransporter) {
      logger.warn('[Notification] Email transporter not initialized');
      return false;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || 'Debugg Dashboard <noreply@debugg.local>',
      to: payload.to || config.recipients,
      subject: payload.subject || `[${payload.priority?.toUpperCase()}] ${payload.title}`,
      html: this.renderEmailTemplate(payload)
    };

    await this.emailTransporter.sendMail(mailOptions);
    logger.info('[Notification] Email sent', { to: mailOptions.to });
    return true;
  }

  /**
   * Send Slack notification
   */
  private async sendSlack(config: any, payload: NotificationPayload): Promise<boolean> {
    const webhookUrl = config.webhookUrl;

    if (!webhookUrl) {
      logger.warn('[Notification] Slack webhook URL not configured');
      return false;
    }

    const color = this.getPriorityColor(payload.priority);

    const payload_slack = {
      attachments: [{
        color,
        title: payload.title,
        text: payload.message,
        fields: Object.entries(payload.data || {}).map(([key, value]) => ({
          title: key,
          value: String(value),
          short: true
        })),
        footer: 'Debugg Dashboard',
        ts: Math.floor(Date.now() / 1000)
      }]
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload_slack)
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }

    logger.info('[Notification] Slack message sent');
    return true;
  }

  /**
   * Send webhook notification
   */
  private async sendWebhook(config: any, payload: NotificationPayload): Promise<boolean> {
    const webhookUrl = config.url;

    if (!webhookUrl) {
      logger.warn('[Notification] Webhook URL not configured');
      return false;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Notification-Type': payload.type,
        'X-Notification-Priority': payload.priority || 'normal'
      },
      body: JSON.stringify({
        title: payload.title,
        message: payload.message,
        data: payload.data,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    logger.info('[Notification] Webhook sent');
    return true;
  }

  /**
   * Render email template
   */
  private renderEmailTemplate(payload: NotificationPayload): string {
    const priorityColors = {
      low: '#22c55e',
      normal: '#3b82f6',
      high: '#f97316',
      critical: '#ef4444'
    };

    const color = priorityColors[payload.priority || 'normal'];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f5; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
          .header { background: ${color}; color: white; padding: 20px; }
          .header h1 { margin: 0; font-size: 20px; }
          .content { padding: 20px; }
          .content p { margin: 0 0 16px; line-height: 1.6; }
          .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
          .data-item { background: #f4f4f5; padding: 12px; border-radius: 6px; }
          .data-label { font-size: 12px; color: #71717a; text-transform: uppercase; }
          .data-value { font-size: 14px; font-weight: 600; margin-top: 4px; }
          .footer { background: #f4f4f5; padding: 20px; text-align: center; font-size: 12px; color: #71717a; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${payload.title}</h1>
          </div>
          <div class="content">
            <p>${payload.message}</p>
            
            ${Object.entries(payload.data || {}).map(([key, value]) => `
              <div class="data-grid">
                <div class="data-item">
                  <div class="data-label">${key}</div>
                  <div class="data-value">${value}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="footer">
            <p>Debugg Dashboard | Error Monitoring System</p>
            <p>Sent at ${new Date().toLocaleString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Get priority color for Slack
   */
  private getPriorityColor(priority?: string): string {
    const colors: Record<string, string> = {
      low: '#22c55e',
      normal: '#3b82f6',
      high: '#f97316',
      critical: '#ef4444'
    };
    return colors[priority || 'normal'] || '#3b82f6';
  }

  /**
   * Send critical error alert
   */
  async sendCriticalErrorAlert(error: any, projectId: string): Promise<void> {
    const payload: NotificationPayload = {
      type: 'CRITICAL_ERROR',
      title: '🚨 Critical Error Detected',
      message: `A critical error has been detected in your application.`,
      priority: 'critical',
      data: {
        'Error ID': error.errorId,
        'Message': error.message,
        'Severity': error.severity,
        'Service': error.metadata?.serviceName,
        'Environment': error.metadata?.environment,
        'Timestamp': new Date(error.timestamp).toLocaleString()
      }
    };

    await this.send(projectId, payload);
  }

  /**
   * Send daily summary
   */
  async sendDailySummary(stats: any, projectId: string, recipients: string[]): Promise<void> {
    const payload: NotificationPayload = {
      to: recipients,
      type: 'DAILY_SUMMARY',
      title: '📊 Daily Error Summary',
      message: `Here's your daily summary of errors and system activity.`,
      priority: 'low',
      data: stats
    };

    await this.send(projectId, payload);
  }
}

// Singleton instance
const notificationService = new NotificationService();

export default notificationService;
export { NotificationService };
