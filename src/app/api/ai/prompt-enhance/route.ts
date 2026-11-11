import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { createPromptEnhanceLog } from '@/shared/models/prompt-enhance-log';

export async function POST(req: Request) {
    try {
        const { text, mode, image } = await req.json();

        if (!text || typeof text !== 'string' || !text.trim()) {
            return respErr('text is required');
        }

        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        const apiKey = process.env.PROMPT_OPTIMIZER_API_KEY || '';
        if (!apiKey) {
            return respErr('prompt optimizer not configured');
        }

        const normalizedMode: 'image' | 'video' = mode === 'video' ? 'video' : 'image';

        const body: Record<string, unknown> = {
            enable_sync_mode: true,
            text: text.trim(),
            mode: normalizedMode,
            style: 'default',
        };
        if (image) body.image = image;

        const res = await fetch('https://api.wavespeed.ai/api/v3/wavespeed-ai/prompt-optimizer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) {
            const errText = await res.text();
            console.warn('[prompt-enhance] API error:', res.status, errText);
            return respErr('prompt enhance failed');
        }

        const data = await res.json();
        console.log('[prompt-enhance] response data:', JSON.stringify(data, null, 2));

        // 与 common-handler 中 callPromptOptimizer 保持一致的解析逻辑
        const outputs = data?.data?.outputs;
        const optimized =
            (Array.isArray(outputs)
                ? outputs.find((v: any) => typeof v === 'string' && v.trim())
                : undefined) ??
            data?.data?.text ??
            data?.data?.output ??
            data?.result?.optimized_prompt ??
            data?.text ??
            data?.output ??
            data?.optimized_prompt;

        if (typeof optimized !== 'string' || !optimized.trim()) {
            console.warn('[prompt-enhance] No optimized text in response:', Object.keys(data || {}));
            return respErr('no enhanced prompt returned');
        }

        const originalPrompt = text.trim();
        const optimizedPrompt = optimized.trim();

        try {
            await createPromptEnhanceLog({
                userId: user.id,
                source: 'manual',
                mode: normalizedMode,
                scene: '',
                originalPrompt,
                optimizedPrompt,
            });
        } catch (logError) {
            console.warn('[prompt-enhance] failed to save prompt enhance log:', logError);
        }

        return respData({ text: optimizedPrompt });
    } catch (e: any) {
        console.error('[prompt-enhance] error:', e);
        return respErr(e.message || 'prompt enhance failed');
    }
}
