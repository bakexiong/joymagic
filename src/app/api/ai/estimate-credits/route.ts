import { respData, respErr } from '@/shared/lib/resp';
import { calculateRequiredCredits } from '@/config/credit-config';

export async function POST(req: Request) {
    try {
        // 积分估算接口允许未登录用户调用，用于展示所需积分
        // const user = await getUserInfo();
        // if (!user) {
        //     return respErr('no auth, please sign in');
        // }

        // 安全地解析请求体
        let body: any = {};
        try {
            const text = await req.text();
            if (text && text.trim()) {
                body = JSON.parse(text);
            }
        } catch (parseError: any) {
            console.error('Failed to parse request body:', parseError);
            return respErr('Invalid request body format');
        }

        const { apiKey, params } = body || {};
        if (!apiKey || typeof apiKey !== 'string') {
            return respErr('apiKey is required');
        }

        const requiredCredits = await calculateRequiredCredits(apiKey, params || {});
        return respData({ requiredCredits });
    } catch (e: any) {
        console.error('estimate credits failed', e);
        return respErr(e.message || 'estimate credits failed');
    }
}


