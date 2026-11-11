import { getUserInfo } from "@/shared/models/user";
import {
  SubscriptionEmailData,
  SubscriptionEmailTemplate,
  EmailSendResult,
  SubscriptionEmailType,
} from "@/shared/types/email/subscription-email";
import { getEmailService } from "@/shared/services/email";
import { Configs } from "@/shared/models/config";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {
    // EmailService 作为上层业务逻辑，使用 EmailManager 来发送邮件
    // SMTP 相关逻辑已封装到 AliyunProvider 中
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * 获取邮件主题色
   * 使用网站主题色（紫色系），转换为 hex 格式以兼容邮件客户端
   */
  private getEmailThemeColors() {
    return {
      primary: '#8B5CF6', // 紫色主题色（从 oklch 转换）
      primaryDark: '#7C3AED', // 深紫色
      primaryLight: '#A78BFA', // 浅紫色
      success: '#10B981', // 成功绿色
      background: '#FFFFFF',
      backgroundAlt: '#F9FAFB',
      text: '#1F2937',
      textSecondary: '#6B7280',
      textMuted: '#9CA3AF',
      border: '#E5E7EB',
      accent: '#F3F4F6',
    };
  }

  /**
   * 获取邮件头像 URL
   */
  private getEmailAvatarUrl(configs: Configs): string {
    return configs.email_avatar_url ||
      configs.next_public_email_avatar_url ||
      (configs.next_public_web_url || configs.app_url || '') + '/logo.png' ||
      '';
  }

  /**
   * 生成带头像的邮件头部
   */
  private getEmailHeader(productName: string, configs: Configs, avatarUrl?: string, variant: 'primary' | 'success' = 'primary'): string {
    const colors = this.getEmailThemeColors();
    const headerColor = variant === 'success' ? colors.success : colors.primary;
    const avatar = avatarUrl || this.getEmailAvatarUrl(configs);
    const avatarHtml = avatar
      ? `<img src="${avatar}" alt="${productName}" style="width: 64px; height: 64px; border-radius: 50%; margin-bottom: 12px; object-fit: cover; border: 3px solid rgba(255, 255, 255, 0.3);" />`
      : '';

    return `
      <div style="background: linear-gradient(135deg, ${headerColor} 0%, ${variant === 'success' ? colors.success : colors.primaryDark} 100%); color: white; padding: 32px 20px; text-align: center; border-radius: 12px 12px 0 0;">
        ${avatarHtml}
        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">${productName}</h1>
      </div>
    `;
  }

  /**
   * 生成邮件容器样式
   */
  private getEmailContainerStyle(): string {
    const colors = this.getEmailThemeColors();
    return `
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      background-color: ${colors.background};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
      border: 1px solid ${colors.border};
    `;
  }

  /**
   * 生成内容区域样式
   */
  private getEmailContentStyle(): string {
    return `padding: 40px 32px;`;
  }

  /**
   * 生成文本样式
   */
  private getEmailTextStyle(size: 'base' | 'sm' = 'base'): string {
    const colors = this.getEmailThemeColors();
    const fontSize = size === 'sm' ? '14px' : '16px';
    return `
      font-size: ${fontSize};
      line-height: 1.7;
      color: ${colors.text};
      margin: 0 0 16px 0;
    `;
  }

  /**
   * 生成强调文本样式
   */
  private getEmailStrongStyle(): string {
    const colors = this.getEmailThemeColors();
    return `
      font-weight: 600;
      color: ${colors.text};
    `;
  }

  /**
   * 生成链接样式
   */
  private getEmailLinkStyle(): string {
    const colors = this.getEmailThemeColors();
    return `
      color: ${colors.primary};
      text-decoration: none;
      font-weight: 500;
      border-bottom: 1px solid ${colors.primaryLight};
      transition: all 0.2s;
    `;
  }

  /**
   * 生成信息卡片样式
   */
  private getEmailInfoCardStyle(borderColor?: string): string {
    const colors = this.getEmailThemeColors();
    const border = borderColor || colors.primary;
    return `
      background-color: ${colors.backgroundAlt};
      border-left: 4px solid ${border};
      padding: 16px 20px;
      margin: 24px 0;
      border-radius: 6px;
    `;
  }

  /**
   * 生成页脚样式
   */
  private getEmailFooterStyle(): string {
    const colors = this.getEmailThemeColors();
    return `
      background-color: ${colors.backgroundAlt};
      padding: 24px 32px;
      text-align: center;
      color: ${colors.textSecondary};
      font-size: 14px;
      border-top: 1px solid ${colors.border};
      border-radius: 0 0 12px 12px;
    `;
  }

  /**
   * 发送邮件（使用 EmailManager）
   */
  async sendEmail(options: EmailOptions, configs: Configs): Promise<{ success: boolean; error?: string; data?: any }> {
    console.log('[sendEmail] 开始发送邮件', JSON.stringify({
      to: options.to,
      subject: options.subject,
      hasHtml: !!options.html,
      hasText: !!options.text,
      from: options.from,
    }));

    try {
      const emailManager = getEmailService(configs);
      console.log('[sendEmail] EmailManager 获取成功');

      const emailMessage = {
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      };

      console.log('[sendEmail] 准备调用 emailManager.sendEmail');
      const result = await emailManager.sendEmail(emailMessage);

      console.log('[sendEmail] emailManager.sendEmail 返回结果', JSON.stringify(result));

      if (result.success) {
        console.log('[sendEmail] 邮件发送成功', JSON.stringify({
          messageId: result.messageId,
          provider: result.provider,
        }));
        return {
          success: true,
          data: {
            messageId: result.messageId,
            provider: result.provider,
          },
        };
      }

      console.error('[sendEmail] 邮件发送失败', JSON.stringify({
        error: result.error || '发送邮件失败',
      }));
      return {
        success: false,
        error: result.error || '发送邮件失败',
      };
    } catch (error: any) {
      console.error("[sendEmail] 发送邮件异常:", {
        error: error?.message || error?.toString() || String(error),
        stack: error?.stack,
        to: options.to,
        subject: options.subject,
      });
      return {
        success: false,
        error: error?.message || error?.toString() || String(error),
      };
    }
  }

  /**
   * 发送重置密码邮件
   */
  async sendResetPasswordEmail(params: {
    email: string;
    url: string;
    appName?: string;
    configs: Configs;
  }): Promise<{ success: boolean; error?: string }> {
    const { email, url, appName, configs } = params;
    if (!email || !url) {
      return { success: false, error: 'email and url are required' };
    }
    const finalAppName =
      appName || configs.app_name || configs.register_platform || "Barko Bear";

    const colors = this.getEmailThemeColors();
    const avatarUrl =
      configs.email_avatar_url || configs.next_public_email_avatar_url;
    const webUrl =
      configs.next_public_web_url || configs.app_url || "https://barkobear.com";

    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader('Reset your password', configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">
            Hi,<br/>
            You requested to reset your <strong style="${this.getEmailStrongStyle()}">${finalAppName}</strong> account password.
          </p>
          <p style="${this.getEmailTextStyle()}">
            Click the button below to securely create a new password. This link is valid for a limited time.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a
              href="${url}"
              style="
                display: inline-block;
                padding: 12px 28px;
                border-radius: 999px;
                background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
                background-color: ${colors.primary};
                color: #ffffff !important;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                letter-spacing: 0.03em;
                box-shadow: 0 10px 30px rgba(0,0,0,0.18);
              "
            >
              Reset password
            </a>
          </div>

          <div style="${this.getEmailInfoCardStyle()}">
            <p style="${this.getEmailTextStyle('sm')} margin: 0;">
              If you did not request this change, you can safely ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <p style="${this.getEmailTextStyle('sm')}">
            Or copy and paste this URL into your browser:
          </p>
          <p style="${this.getEmailTextStyle('sm')} word-break: break-all;">
            ${url}
          </p>

          <p style="${this.getEmailTextStyle('sm')}">
            You can always manage your account settings at
            <a href="${webUrl}" style="${this.getEmailLinkStyle()}">${webUrl}</a>.
          </p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">You are receiving this email because a password reset was requested for your account.</p>
        </div>
      </div>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: `[${finalAppName}] Reset your password`,
      html,
    }, configs);

    return { success: result.success, error: result.error };
  }

  /**
   * 发送邮箱验证邮件
   */
  async sendEmailVerificationEmail(params: {
    email: string;
    url: string;
    appName?: string;
    configs: Configs;
  }): Promise<{ success: boolean; error?: string }> {
    const { email, url, appName, configs } = params;
    if (!email || !url) {
      return { success: false, error: 'email and url are required' };
    }
    const finalAppName =
      appName || configs.app_name || configs.register_platform || "Barko Bear";

    const colors = this.getEmailThemeColors();
    const avatarUrl =
      configs.email_avatar_url || configs.next_public_email_avatar_url;
    const webUrl =
      configs.next_public_web_url || configs.app_url || "https://barkobear.com";

    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader('Verify your email', configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">
            Hi,<br/>
            Thank you for signing up for <strong style="${this.getEmailStrongStyle()}">${finalAppName}</strong>.
          </p>
          <p style="${this.getEmailTextStyle()}">
            Please confirm your email address by clicking the button below.
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <a
              href="${url}"
              style="
                display: inline-block;
                padding: 12px 28px;
                border-radius: 999px;
                background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%);
                background-color: ${colors.primary};
                color: #ffffff !important;
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                letter-spacing: 0.03em;
                box-shadow: 0 10px 30px rgba(0,0,0,0.18);
              "
            >
              Verify email
            </a>
          </div>

          <div style="${this.getEmailInfoCardStyle()}">
            <p style="${this.getEmailTextStyle('sm')} margin: 0;">
              If you did not create an account with this email, you can safely ignore this message.
            </p>
          </div>

          <p style="${this.getEmailTextStyle('sm')}">
            Or copy and paste this URL into your browser:
          </p>
          <p style="${this.getEmailTextStyle('sm')} word-break: break-all;">
            ${url}
          </p>

          <p style="${this.getEmailTextStyle('sm')}">
            After verification, you can sign in at
            <a href="${webUrl}" style="${this.getEmailLinkStyle()}">${webUrl}</a>.
          </p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">You are receiving this email because a new account was created using this address.</p>
        </div>
      </div>
    `;

    const result = await this.sendEmail({
      to: email,
      subject: `[${finalAppName}] Verify your email`,
      html,
    }, configs);

    return { success: result.success, error: result.error };
  }

  /**
   * 发送欢迎邮件
   */
  async sendWelcomeEmail(
    email: string,
    configs: Configs,
    name?: string,
    productName?: string,
    supportEmail?: string
  ) {
    const defaultProductName = configs.register_platform || configs.app_name || "Barko Bear";
    const defaultSupportEmail = configs.support_email || "noreply@10b.ai";
    const webUrl = configs.next_public_web_url || configs.app_url || "https://barkobear.com";
    const colors = this.getEmailThemeColors();

    const subject = `Welcome to ${productName || defaultProductName}!`;
    const avatarUrl = configs.email_avatar_url || configs.next_public_email_avatar_url;
    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader(`Welcome to ${productName || defaultProductName}!`, configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">Hi <strong style="${this.getEmailStrongStyle()}">${name || "User"}</strong>,</p>
          <p style="${this.getEmailTextStyle()}">Thank you for signing up for <strong style="${this.getEmailStrongStyle()}">${productName || defaultProductName}</strong>! We're excited to have you on board.</p>
          <p style="${this.getEmailTextStyle()}">You can now start exploring smart conversations and many other powerful features. Log in now to begin your AI journey!</p>
          <div style="${this.getEmailInfoCardStyle()}">
            <p style="margin: 0; ${this.getEmailTextStyle('sm')}">
              <strong style="${this.getEmailStrongStyle()}">💡 Getting Started:</strong> Visit <a href="${webUrl}" style="${this.getEmailLinkStyle()}">${webUrl}</a> to explore all features.
            </p>
          </div>
          <p style="${this.getEmailTextStyle()}">If you have any questions, feel free to contact us at <a href="mailto:${supportEmail || defaultSupportEmail}" style="${this.getEmailLinkStyle()}">${supportEmail || defaultSupportEmail}</a>.</p>
          <p style="${this.getEmailTextStyle()}">Best regards,<br><strong style="${this.getEmailStrongStyle()}">The ${productName || defaultProductName} Team</strong></p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">If you have any questions, please feel free to contact us.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    }, configs);
  }

  /**
   * 发送通知邮件
   */
  async sendNotificationEmail(email: string, title: string, message: string, configs: Configs) {
    const webUrl = configs.next_public_web_url || configs.app_url || "https://barkobear.com";
    const subject = title;
    const avatarUrl = configs.email_avatar_url || configs.next_public_email_avatar_url;
    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader(title, configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">${message}</p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">如果您有任何问题，请随时联系我们。</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    }, configs);
  }

  /**
   * 发送订阅确认邮件
   */
  async sendSubscriptionConfirmationEmail(
    email: string,
    planName: string,
    amount: string,
    configs: Configs,
    userName?: string,
    orderId?: string,
    validPeriod?: string,
    productName?: string,
    supportEmail?: string,
    renewDate?: string
  ) {
    const registerPlatform = configs.register_platform || "Barko Bear";
    const defaultSupportEmail = configs.support_email || "noreply@10b.ai";
    const webUrl = configs.next_public_web_url || configs.app_url || "https://barkobear.com";

    const colors = this.getEmailThemeColors();
    const subject = `Thank You for Your Subscription!`;
    const avatarUrl = configs.email_avatar_url || configs.next_public_email_avatar_url;
    const purchaseDate =
      renewDate ||
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader('Thank You for Your Subscription!', configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">Hi <strong style="${this.getEmailStrongStyle()}">${userName || "User"}</strong>,</p>
          <p style="${this.getEmailTextStyle()}">Thank you for subscribing to <strong style="${this.getEmailStrongStyle()}">${planName}</strong>.</p>
          <p style="${this.getEmailTextStyle()}">This email confirms your subscription to the following:</p>

          <div style="${this.getEmailInfoCardStyle()}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Subscription Plan:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Content Provider:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${registerPlatform}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Purchase Date:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${purchaseDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Renewal Price:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right; color: ${colors.primary}; font-weight: 600;">${amount}</td>
              </tr>
            </table>
          </div>

          <p style="${this.getEmailTextStyle()}">Starting from <strong style="${this.getEmailStrongStyle()}">${purchaseDate}</strong>, your subscription will automatically renew at <strong style="${this.getEmailStrongStyle()}">${amount}</strong> until you cancel.</p>
          <p style="${this.getEmailTextStyle()}">To avoid unnecessary charges, you must cancel your subscription at least one day before each renewal date. To view details or cancel your subscription, please check your <a href="${webUrl}/settings/payments" style="${this.getEmailLinkStyle()}">subscription settings</a>.</p>
         
          <p style="${this.getEmailTextStyle()}">If you have any questions, contact us at <a href="mailto:${supportEmail || defaultSupportEmail}" style="${this.getEmailLinkStyle()}">${supportEmail || defaultSupportEmail}</a>.</p>
          <p style="${this.getEmailTextStyle()}">Best regards,<br><strong style="${this.getEmailStrongStyle()}">The ${registerPlatform} Team</strong></p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">For help with subscriptions and purchases, please visit our support page.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    }, configs);
  }

  /**
   * 发送续期成功邮件
   */
  async sendRenewalSuccessEmail(
    email: string,
    planName: string,
    amount: string,
    configs: Configs,
    userName?: string,
    orderId?: string,
    renewDate?: string,
    productName?: string,
    supportEmail?: string
  ) {
    const defaultProductName = configs.register_platform || configs.app_name || "Our Platform";
    const defaultSupportEmail = configs.support_email || "support@yourdomain.com";
    const webUrl = configs.next_public_web_url || configs.app_url || "https://barkobear.com";
    const registerPlatform = configs.register_platform || "Barko Bear";

    const colors = this.getEmailThemeColors();
    const subject = `Your Subscription Has Been Renewed Successfully!`;
    const avatarUrl = configs.email_avatar_url || configs.next_public_email_avatar_url;
    const renewalDate = renewDate || new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader('Subscription Renewed Successfully!', configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">Hi <strong style="${this.getEmailStrongStyle()}">${userName || "User"}</strong>,</p>
          <p style="${this.getEmailTextStyle()}">Great news! Your subscription to <strong style="${this.getEmailStrongStyle()}">${productName || defaultProductName}</strong> has been renewed successfully.</p>
          <p style="${this.getEmailTextStyle()}">Here are the details of your renewal:</p>
          
          <div style="${this.getEmailInfoCardStyle()}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Subscription Plan:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Content Provider:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${registerPlatform}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Renewal Date:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${renewalDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Amount Charged:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right; color: ${colors.primary}; font-weight: 600;">${amount}</td>
              </tr>
            </table>
          </div>
          
          <p style="${this.getEmailTextStyle()}">Your subscription will continue to automatically renew at <strong style="${this.getEmailStrongStyle()}">${amount}</strong> until you cancel. To manage your subscription or cancel anytime, please visit your <a href="${webUrl}/settings/payments" style="${this.getEmailLinkStyle()}">subscription settings</a>.</p>
          <p style="${this.getEmailTextStyle()}">If you have any questions, contact us at <a href="mailto:${supportEmail || defaultSupportEmail}" style="${this.getEmailLinkStyle()}">${supportEmail || defaultSupportEmail}</a>.</p>
          <p style="${this.getEmailTextStyle()}">Best regards,<br><strong style="${this.getEmailStrongStyle()}">The ${productName || defaultProductName} Team</strong></p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">For help with subscriptions and purchases, please visit our support page.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    }, configs);
  }

  /**
   * 发送一次性购买/充值邮件
   */
  async sendOneTimePaymentEmail(
    email: string,
    amount: string,
    configs: Configs,
    itemName?: string,
    orderId?: string,
    supportEmail?: string,
    purchaseDate?: string
  ) {

    try {
      const registerPlatform = configs.register_platform || configs.app_name || "Barko Bear";
      const defaultSupportEmail = configs.support_email || "noreply@10b.ai";
      const webUrl = configs.next_public_web_url || configs.app_url || "https://barkobear.com";
      const colors = this.getEmailThemeColors();

      const subject = `Your Payment Receipt`;
      const avatarUrl = configs.email_avatar_url || configs.next_public_email_avatar_url;
      const paidAt =
        purchaseDate ||
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

      const html = `
      <div style="${this.getEmailContainerStyle()}">
        ${this.getEmailHeader('Payment Receipt', configs, avatarUrl)}
        <div style="${this.getEmailContentStyle()}">
          <p style="${this.getEmailTextStyle()}">Hi <strong style="${this.getEmailStrongStyle()}">${email}</strong>,</p>
          <p style="${this.getEmailTextStyle()}">We've received your payment for <strong style="${this.getEmailStrongStyle()}">${itemName || "One-time purchase"}</strong>.</p>
          
          <div style="${this.getEmailInfoCardStyle()}">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Item:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${itemName || "One-time purchase"}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Amount:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right; color: ${colors.primary}; font-weight: 600;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Paid At:</strong></td>
                <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${paidAt}</td>
              </tr>
              ${orderId
          ? `<tr>
                      <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}"><strong style="${this.getEmailStrongStyle()}">Order ID:</strong></td>
                      <td style="padding: 8px 0; ${this.getEmailTextStyle('sm')}; text-align: right;">${orderId}</td>
                    </tr>`
          : ""
        }
            </table>
          </div>

          <p style="${this.getEmailTextStyle()}">You can view your payment details or download invoices in your <a href="${webUrl}/settings/payments" style="${this.getEmailLinkStyle()}">billing center</a>.</p>
          <p style="${this.getEmailTextStyle()}">If you have any questions, contact us at <a href="mailto:${supportEmail || defaultSupportEmail}" style="${this.getEmailLinkStyle()}">${supportEmail || defaultSupportEmail}</a>.</p>
          <p style="${this.getEmailTextStyle()}">Best regards,<br><strong style="${this.getEmailStrongStyle()}">The ${registerPlatform} Team</strong></p>
        </div>
        <div style="${this.getEmailFooterStyle()}">
          <p style="margin: 0;">Thank you for your purchase.</p>
        </div>
      </div>
    `;
      const result = await this.sendEmail({
        to: email,
        subject,
        html,
      }, configs);
      return result;
    } catch (error: any) {
      console.log("[sendOneTimePaymentEmail] 错误详情:", JSON.stringify({
        error: error?.message || error?.toString() || String(error),
        stack: error?.stack,
        name: error?.name,
        cause: error?.cause,
        email,
        amount,
        itemName,
        orderId,
      }, null, 2));
      return {
        success: false,
        error: error?.message || error?.toString() || String(error),
      };
    }
  }
}

// 导出单例实例
export const emailService = EmailService.getInstance();
