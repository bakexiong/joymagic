// 邮件发送用的订阅数据结构
export interface SubscriptionEmailData {
  // 基本信息
  id: string;
  status: string;

  // 订阅周期信息
  current_period_start: number; // Unix timestamp
  current_period_end: number; // Unix timestamp
  cancel_at_period_end: boolean;
  canceled_at?: number; // Unix timestamp

  // 计划信息
  planName?: string;
  priceId?: string;

  // 价格和计费信息
  items?: any; // 使用 any 类型来匹配 Stripe 的复杂结构

  // 元数据
  metadata?: {
    order_no?: string;
    planName?: string;
    product_name?: string;
    user_email?: string;
    [key: string]: any;
  };

  // 客户信息
  customer?: string;

  // 时间戳
  created: number; // Unix timestamp
  updated?: number; // Unix timestamp (可选)
  amount?: string;
}

// 邮件模板参数
export interface SubscriptionEmailTemplate {
  // 收件人信息
  email: string;
  userName?: string;

  // 订阅信息
  planName: string;
  amount: string; // 格式化后的金额，如 "$9.99/month"
  orderId?: string;
  validPeriod?: string; // 有效期，如 "2024-12-31"

  // 产品信息
  productName?: string;
  supportEmail?: string;

  // 订阅状态
  status: string;
  isActive: boolean;
  willCancelAtPeriodEnd: boolean;

  // 计费信息
  nextBillingDate?: string;
  currentPeriodEnd?: string;
  renewDate?: string;
}

// 邮件发送结果
export interface EmailSendResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// 订阅邮件类型枚举
export enum SubscriptionEmailType {
  WELCOME = "welcome",
  CONFIRMATION = "confirmation",
  RENEWAL = "renewal",
  CANCELLATION = "cancellation",
  EXPIRATION = "expiration",
  PAYMENT_FAILED = "payment_failed",
  PAYMENT_SUCCEEDED = "payment_succeeded",
}

// 邮件发送配置
export interface EmailConfig {
  fromEmail: string;
  replyToEmail?: string;
  supportEmail: string;
  productName: string;
  companyName: string;
  websiteUrl?: string;
}
