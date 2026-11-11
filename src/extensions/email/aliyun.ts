// @ts-ignore - nodemailer types may not be available
import nodemailer from 'nodemailer';
import { isCloudflareWorker } from '@/shared/lib/env';

import type {
    EmailConfigs,
    EmailMessage,
    EmailProvider,
    EmailSendResult,
} from '.';

/**
 * Aliyun DirectMail email provider configs
 * Supports both SMTP and HTTP API modes
 * @docs https://help.aliyun.com/product/29412.html
 */
export interface AliyunConfigs extends EmailConfigs {
    accountName?: string; // 发信地址
    fromAlias?: string; // 发信人昵称
    supportEmail?: string; // 支持邮箱地址
    // HTTP API 配置（用于 Cloudflare Worker）
    accessKeyId?: string; // 阿里云 AccessKeyId
    accessKeySecret?: string; // 阿里云 AccessKeySecret
    region?: string; // 阿里云区域，默认 cn-hangzhou
    // SMTP 配置（用于 Node.js 环境）
    smtpHost?: string; // SMTP 服务器地址，默认 smtpdm.aliyun.com
    smtpPort?: number; // SMTP 端口，默认 80
    smtpSecure?: boolean; // 是否使用 SSL/TLS
    smtpUser?: string; // SMTP 用户名
    smtpPass?: string; // SMTP 密码
}

/**
 * Aliyun DirectMail email provider implementation
 * Supports both SMTP (Node.js) and HTTP API (Cloudflare Worker) modes
 * @website https://www.alibabacloud.com/product/directmail
 */
export class AliyunProvider implements EmailProvider {
    readonly name = 'aliyun';
    configs: AliyunConfigs;
    private smtpTransporter: nodemailer.Transporter | null = null;
    private useHttpApi: boolean = false;

    constructor(configs: AliyunConfigs) {
        this.configs = configs;

        // 检测环境：如果是 Cloudflare Worker，使用 HTTP API
        // 否则，如果有 HTTP API 配置也优先使用（更可靠）
        if (isCloudflareWorker || (configs.accessKeyId && configs.accessKeySecret)) {
            this.useHttpApi = true;
            console.log('[AliyunProvider] 使用 HTTP API 模式');
        } else {
            this.initSMTP();
        }
    }

    /**
     * 初始化 SMTP 连接（仅用于 Node.js 环境）
     */
    private initSMTP() {
        const smtpHost = this.configs.smtpHost || 'smtpdm.aliyun.com';
        const smtpPort = this.configs.smtpPort || 80;
        const smtpUser = this.configs.smtpUser || this.configs.accountName || '';
        const smtpPass = this.configs.smtpPass || '';
        const smtpSecure = this.configs.smtpSecure !== undefined
            ? this.configs.smtpSecure
            : (smtpPort === 465);

        if (smtpUser && smtpPass) {
            try {
                const smtpConfig = {
                    host: smtpHost,
                    port: smtpPort,
                    secure: smtpSecure,
                    auth: {
                        user: smtpUser,
                        pass: smtpPass,
                    },
                };

                this.smtpTransporter = nodemailer.createTransport(smtpConfig);
            } catch (error) {
                console.warn('[AliyunProvider] SMTP 初始化失败，将尝试使用 HTTP API:', error);
                this.useHttpApi = true;
            }
        } else {
            console.warn('[AliyunProvider] SMTP 配置不完整，将尝试使用 HTTP API');
            this.useHttpApi = true;
        }
    }

    /**
     * URL 编码函数（符合 RFC 3986）
     * 阿里云要求对特殊字符进行编码
     * 注意：不对已编码的字符再次编码
     */
    private percentEncode(str: string): string {
        // 使用标准的 encodeURIComponent，然后对特殊字符进行额外编码
        return encodeURIComponent(str)
            .replace(/[!'()*]/g, (c) => {
                return '%' + c.charCodeAt(0).toString(16).toUpperCase();
            });
    }

    /**
     * 生成阿里云 API 签名
     * @see https://help.aliyun.com/document_detail/29442.html
     * 
     * 签名步骤：
     * 1. 排除 Signature 参数，对参数按名称排序
     * 2. 对每个参数名和值进行 URL 编码（RFC 3986）
     * 3. 构建规范化查询字符串：key1=value1&key2=value2
     * 4. 构建待签名字符串：METHOD&%2F&ENCODED_CANONICALIZED_QUERY_STRING
     *    注意：需要对整个规范化查询字符串进行编码
     * 5. 使用 HMAC-SHA1 签名（密钥：AccessKeySecret&）
     * 6. Base64 编码
     */
    private async signRequest(
        params: Record<string, string>,
        accessKeySecret: string,
        method: string = 'POST'
    ): Promise<string> {
        // 1. 排除 Signature 参数，按参数名排序
        const sortedKeys = Object.keys(params)
            .filter(key => key !== 'Signature')
            .sort();

        // 2. 构建规范化查询字符串
        // 对每个参数名和值分别进行 URL 编码，然后组成 key=value 对
        const canonicalizedQueryString = sortedKeys
            .map(key => {
                const encodedKey = this.percentEncode(key);
                const encodedValue = this.percentEncode(params[key]);
                return `${encodedKey}=${encodedValue}`;
            })
            .join('&');

        // 3. 构建待签名字符串
        // 格式：METHOD&%2F&ENCODED_CANONICALIZED_QUERY_STRING
        // 注意：需要对整个规范化查询字符串再次进行编码
        const encodedQueryString = this.percentEncode(canonicalizedQueryString);
        const stringToSign = `${method}&${this.percentEncode('/')}&${encodedQueryString}`;

        // 4. 使用 HMAC-SHA1 签名
        const key = `${accessKeySecret}&`;

        // 在 Cloudflare Worker 中使用 Web Crypto API
        if (typeof crypto !== 'undefined' && 'subtle' in crypto) {
            const encoder = new TextEncoder();
            const keyData = encoder.encode(key);
            const messageData = encoder.encode(stringToSign);

            const cryptoKey = await crypto.subtle.importKey(
                'raw',
                keyData,
                { name: 'HMAC', hash: 'SHA-1' },
                false,
                ['sign']
            );

            const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
            // 将 ArrayBuffer 转换为 Base64
            const bytes = new Uint8Array(signature);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        } else {
            // Node.js 环境使用 crypto 模块（fallback，但 Worker 中不会执行到这里）
            const crypto = await import('crypto');
            const hmac = crypto.createHmac('sha1', key);
            hmac.update(stringToSign);
            return hmac.digest('base64');
        }
    }

    /**
     * 通过 HTTP API 发送邮件
     */
    private async sendEmailViaHttpApi(email: EmailMessage): Promise<EmailSendResult> {
        const { accessKeyId, accessKeySecret, accountName, region = 'cn-hangzhou' } = this.configs;

        if (!accessKeyId || !accessKeySecret) {
            return {
                success: false,
                error: 'Aliyun AccessKeyId and AccessKeySecret are required for HTTP API mode',
                provider: this.name,
            };
        }

        const fromEmail = email.from || accountName || '';
        if (!fromEmail) {
            return {
                success: false,
                error: 'From address is required',
                provider: this.name,
            };
        }

        const toAddresses = Array.isArray(email.to) ? email.to : [email.to];

        try {
            // 构建 API 参数
            // 时间戳格式：YYYY-MM-DDTHH:mm:ssZ (ISO 8601)
            const now = new Date();
            const timestamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
            const params: Record<string, string> = {
                Format: 'JSON',
                Version: '2015-11-23',
                AccessKeyId: accessKeyId,
                SignatureMethod: 'HMAC-SHA1',
                Timestamp: timestamp,
                SignatureVersion: '1.0',
                SignatureNonce: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
                Action: 'SingleSendMail',
                AccountName: fromEmail,
                AddressType: '1', // 1: 随机账号, 0: 触发账号
                ToAddress: toAddresses.join(','),
                Subject: email.subject,
                HtmlBody: email.html || email.text || '',
            };

            if (email.text && email.html) {
                params.TextBody = email.text;
            }

            if (this.configs.fromAlias) {
                params.FromAlias = this.configs.fromAlias;
            }


            // 验证邮箱格式
            params.ReplyToAddress = "true"

            // 生成签名（注意：签名时不能包含 Signature 参数）
            const signature = await this.signRequest(params, accessKeySecret);
            params.Signature = signature;

            // 发送请求
            // 手动构建请求体，确保编码方式与签名时一致
            const apiUrl = `https://dm.${region}.aliyuncs.com/`;
            const bodyParts: string[] = [];
            Object.keys(params).sort().forEach(key => {
                // 发送时也需要对参数值进行编码（与签名时的编码方式一致）
                const encodedKey = encodeURIComponent(key);
                const encodedValue = encodeURIComponent(params[key]);
                bodyParts.push(`${encodedKey}=${encodedValue}`);
            });
            const requestBody = bodyParts.join('&');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: requestBody,
            });

            const result = await response.json();

            console.log('[AliyunProvider] sendEmailViaHttpApi result:', result);

            if (result.Code && result.Code !== 'OK') {
                return {
                    success: false,
                    error: result.Message || `API Error: ${result.Code}`,
                    provider: this.name,
                };
            }

            return {
                success: true,
                messageId: result.EnvId || result.RequestId || 'unknown',
                provider: this.name,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || error?.toString() || 'Unknown error',
                provider: this.name,
            };
        }
    }

    /**
     * 通过 SMTP 发送邮件（仅用于 Node.js 环境）
     */
    private async sendEmailViaSMTP(email: EmailMessage): Promise<EmailSendResult> {
        if (!this.smtpTransporter) {
            return {
                success: false,
                error: 'SMTP transporter not initialized. Please configure SMTP settings.',
                provider: this.name,
            };
        }

        try {
            const fromEmail = email.from || this.configs.accountName || '';
            const fromName = this.configs.fromAlias || '';

            if (!fromEmail) {
                return {
                    success: false,
                    error: 'From address is required',
                    provider: this.name,
                };
            }

            const toAddresses = Array.isArray(email.to) ? email.to : [email.to];

            const mailOptions: nodemailer.SendMailOptions = {
                from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
                to: toAddresses.join(', '),
                subject: email.subject,
                html: email.html || email.text,
                text: email.text || (email.html ? email.html.replace(/<[^>]*>/g, '') : undefined),
            };

            if (email.replyTo && email.replyTo.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(email.replyTo.trim())) {
                    mailOptions.replyTo = email.replyTo.trim();
                }
            }

            if (email.cc && email.cc.length > 0) {
                mailOptions.cc = Array.isArray(email.cc) ? email.cc : [email.cc];
            }

            if (email.bcc && email.bcc.length > 0) {
                mailOptions.bcc = Array.isArray(email.bcc) ? email.bcc : [email.bcc];
            }

            const info = await this.smtpTransporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
                provider: this.name,
            };
        } catch (error: any) {
            return {
                success: false,
                error: error?.message || error?.toString() || 'Unknown error',
                provider: this.name,
            };
        }
    }

    async sendEmail(email: EmailMessage): Promise<EmailSendResult> {
        if (this.useHttpApi) {
            return this.sendEmailViaHttpApi(email);
        } else {
            return this.sendEmailViaSMTP(email);
        }
    }
}

/**
 * Create Aliyun provider with configs
 */
export function createAliyunProvider(configs: AliyunConfigs): AliyunProvider {
    return new AliyunProvider(configs);
}
