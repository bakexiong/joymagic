/**
 * NewAPI 平台接口类型定义
 * 基于外部 API 文档：POST /api/external/user/create, GET /api/external/user/balance, POST /api/external/user/recharge
 * 鉴权方式：X-External-API-Key 请求头
 */

// NewAPI 创建用户请求
export interface NewApiRegisterRequest {
  email: string;
  api_key: string; // 为用户创建的 API Key，格式：sk-xxx
  grant_quota: number; // 赠送的额度（美元），最小值 0
  username?: string;
  display_name?: string;
}

// NewAPI 创建用户响应
export interface NewApiRegisterResponse {
  success: boolean;
  userId?: number;
  error?: string;
  data?: {
    user_id: number;
    username: string;
    email: string;
    quota_usd: number;
    quota: number;
    token: {
      id: number;
      key: string;
      name: string;
      unlimited_quota: boolean;
    };
  };
}

// NewAPI 余额查询响应（原始 API 响应）
export interface NewApiBalanceRawResponse {
  success: boolean;
  message?: string;
  data?: {
    user_id: number;
    username: string;
    email: string;
    quota: number; // 内部单位，1 USD = 500,000
    used_quota: number;
    total_quota: number;
    quota_usd: number; // 剩余额度（美元）
    used_quota_usd: number;
    total_quota_usd: number;
    tokens: Array<{
      id: number;
      key: string;
      name: string;
      unlimited_quota: boolean;
    }>;
  };
}

// NewAPI 余额查询结果（内部使用）
export interface NewApiBalanceResponse {
  success: boolean;
  balance?: number; // 剩余额度（美元）
  usedBalance?: number; // 已使用额度（美元）
  totalBalance?: number; // 总额度（美元）
  tokens?: Array<{
    id: number;
    key: string;
    name: string;
    unlimited_quota: boolean;
  }>;
  error?: string;
}

// NewAPI 充值请求（email 和 api_key 二选一）
export interface NewApiRechargeRequest {
  email?: string;
  api_key?: string;
  amount: number; // 充值金额（美元），必须大于 0
}

// NewAPI 充值响应（原始 API 响应）
export interface NewApiRechargeRawResponse {
  success: boolean;
  message?: string;
  data?: {
    user_id: number;
    username: string;
    email: string;
    recharge_amount: number;
    quota_before: number;
    quota_after: number;
    quota_before_usd: number;
    quota_after_usd: number;
  };
}

// NewAPI 充值结果（内部使用）
export interface NewApiRechargeResponse {
  success: boolean;
  balanceAfter?: number; // 充值后余额（美元）
  rechargeAmount?: number; // 充值金额（美元）
  error?: string;
}

// NewAPI 适配器接口
export interface NewApiProvider {
  readonly name: string;

  // 创建用户
  register(request: NewApiRegisterRequest): Promise<NewApiRegisterResponse>;

  // 查询余额（通过邮箱）
  getBalance(email: string): Promise<NewApiBalanceResponse>;

  // 充值（通过邮箱）
  recharge(request: NewApiRechargeRequest): Promise<NewApiRechargeResponse>;
}
