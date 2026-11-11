import { EmailManager, ResendProvider, AliyunProvider } from '@/extensions/email';
import { Configs } from '@/shared/models/config';

/**
 * get email service with configs
 */
export function getEmailServiceWithConfigs(configs: Configs) {
  const emailManager = new EmailManager();

  const defaultProvider = configs.default_email_provider || 'aliyun';

  // 添加阿里云邮件服务（支持 SMTP 和 HTTP API）
  if (configs.aliyun_email_enabled !== 'false') {
    const accessKeyId = configs.aliyun_access_key_id || '';
    const accessKeySecret = configs.aliyun_access_key_secret || '';
    const region = configs.aliyun_region || 'cn-hangzhou';

    // 从 configs 获取阿里云 SMTP 配置（用于 Node.js 环境）
    const smtpHost = configs.aliyun_smtp_host || configs.smtp_host || 'smtpdm.aliyun.com';
    const smtpPort = configs.aliyun_smtp_port || configs.smtp_port;
    const smtpUser = configs.aliyun_smtp_user || configs.smtp_user || configs.aliyun_account_name || '';
    const smtpPass = configs.aliyun_smtp_pass || configs.smtp_pass || '';

    // 优先使用 HTTP API（如果配置了 AccessKey），否则使用 SMTP
    if (accessKeyId && accessKeySecret) {
      emailManager.addProvider(
        new AliyunProvider({
          accountName: configs.aliyun_account_name,
          fromAlias: configs.aliyun_from_alias,
          supportEmail: configs.support_email,
          accessKeyId,
          accessKeySecret,
          region,
          // 也提供 SMTP 配置作为 fallback
          smtpHost,
          smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
          smtpSecure: configs.smtp_secure === 'true',
          smtpUser,
          smtpPass,
        }),
        defaultProvider === 'aliyun'
      );
    } else if (smtpUser && smtpPass) {
      // 如果没有 HTTP API 配置，使用 SMTP（仅 Node.js 环境）
      emailManager.addProvider(
        new AliyunProvider({
          accountName: configs.aliyun_account_name,
          fromAlias: configs.aliyun_from_alias,
          supportEmail: configs.support_email,
          smtpHost,
          smtpPort: smtpPort ? parseInt(smtpPort) : undefined,
          smtpSecure: configs.smtp_secure === 'true',
          smtpUser,
          smtpPass,
        }),
        defaultProvider === 'aliyun'
      );
    }
  }

  // 添加 Resend 邮件服务
  if (configs.resend_email_enabled !== 'false' && configs.resend_api_key) {
    emailManager.addProvider(
      new ResendProvider({
        apiKey: configs.resend_api_key,
        defaultFrom: configs.resend_sender_email,
      }),
      defaultProvider === 'resend'
    );
  }

  return emailManager;
}

/**
 * get email service instance
 * @param configs - 配置对象，必须传入
 */
export function getEmailService(configs: Configs): EmailManager {
  return getEmailServiceWithConfigs(configs);
}
