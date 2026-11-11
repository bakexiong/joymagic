import {
  NewApiProvider,
  NewApiRegisterRequest,
  NewApiRegisterResponse,
  NewApiBalanceResponse,
  NewApiBalanceRawResponse,
  NewApiRechargeRequest,
  NewApiRechargeResponse,
  NewApiRechargeRawResponse,
} from './types';

const DEFAULT_TIMEOUT = 10000; // 10s

export class NewApiClient implements NewApiProvider {
  readonly name = 'newapi';
  private baseUrl: string;
  private adminKey: string;
  private timeout: number;

  constructor(baseUrl: string, adminKey: string, timeout?: number) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.adminKey = adminKey;
    this.timeout = timeout || DEFAULT_TIMEOUT;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${path}`;
      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-External-API-Key': this.adminKey,
          ...options.headers,
        },
      });

      const json = (await res.json()) as any;

      if (!res.ok || json.success === false) {
        const errorMessage = json.message || json.error || json.data?.message || `NewAPI request failed: ${res.status} ${res.statusText}`;
        console.error('[NewAPI] Request failed:', {
          url,
          status: res.status,
          statusText: res.statusText,
          response: json,
          errorMessage,
        });
        throw new Error(errorMessage);
      }

      return json as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error(`NewAPI request timeout after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  async register(
    req: NewApiRegisterRequest
  ): Promise<NewApiRegisterResponse> {
    try {
      const data = await this.request<any>('/api/external/user/create', {
        method: 'POST',
        body: JSON.stringify({
          email: req.email,
          api_key: req.api_key,
          grant_quota: req.grant_quota,
          username: req.username,
          display_name: req.display_name,
        }),
      });

      return {
        success: true,
        userId: data?.data?.user_id,
        data: data?.data,
      };
    } catch (error: any) {
      console.error('[NewAPI] register failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getBalance(email: string): Promise<NewApiBalanceResponse> {
    try {
      const data = await this.request<NewApiBalanceRawResponse>(
        `/api/external/user/balance?email=${encodeURIComponent(email)}`
      );

      return {
        success: true,
        balance: data?.data?.quota_usd,
        usedBalance: data?.data?.used_quota_usd,
        totalBalance: data?.data?.total_quota_usd,
        tokens: data?.data?.tokens || [],
      };
    } catch (error: any) {
      console.error('[NewAPI] getBalance failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async recharge(req: NewApiRechargeRequest): Promise<NewApiRechargeResponse> {
    try {
      // 验证请求参数
      if (!req.amount || req.amount <= 0) {
        return { success: false, error: 'Amount must be greater than 0' };
      }

      if (!req.email && !req.api_key) {
        return { success: false, error: 'Either email or api_key is required' };
      }

      const body: Record<string, any> = { amount: req.amount };
      if (req.email) {
        body.email = req.email.trim();
      }
      if (req.api_key) {
        body.api_key = req.api_key.trim();
      }

      console.log('[NewAPI] recharge request:', {
        email: req.email ? `${req.email.substring(0, 3)}***` : undefined,
        amount: req.amount,
        hasApiKey: !!req.api_key
      });

      const data = await this.request<NewApiRechargeRawResponse>(
        '/api/external/user/recharge',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      );

      return {
        success: true,
        balanceAfter: data?.data?.quota_after_usd,
        rechargeAmount: data?.data?.recharge_amount,
      };
    } catch (error: any) {
      console.error('[NewAPI] recharge failed:', {
        message: error.message,
        email: req.email ? `${req.email.substring(0, 3)}***` : undefined,
        amount: req.amount,
        hasApiKey: !!req.api_key,
        error: error.toString(),
      });
      return { success: false, error: error.message || 'Unknown error' };
    }
  }
}
