import { respData, respErr } from '@/shared/lib/resp';

const HF_ENDPOINT =
  'https://f592oi71y754lo3j.us-east-1.aws.endpoints.huggingface.cloud';
const HF_TOKEN = process.env.HF_TOKEN;

export async function POST(request: Request) {
  try {
    if (!HF_TOKEN) {
      throw new Error('HF_TOKEN is not configured in environment variables');
    }

    const { prompt, parameters } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      throw new Error('prompt is required');
    }

    const body = {
      inputs: prompt,
      parameters: parameters || {},
    };

    const hfResponse = await fetch(HF_ENDPOINT, {
      method: 'POST',
      headers: {
        // Request JSON (base64 image); avoids PIL serialization errors on list outputs
        Accept: 'application/json',
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!hfResponse.ok) {
      let errorText = '';
      try {
        errorText = await hfResponse.text();
      } catch {
        // ignore
      }
      throw new Error(
        `huggingface request failed: ${hfResponse.status} ${hfResponse.statusText} ${errorText}`,
      );
    }

    const contentType = hfResponse.headers.get('content-type') || '';

    let imageUrl: string;

    if (!contentType || contentType.startsWith('image/')) {
      const arrayBuffer = await hfResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mime = contentType || 'image/png';
      imageUrl = `data:${mime};base64,${base64}`;
    } else if (contentType.includes('application/json')) {
      const data = await hfResponse.json();

      if (data?.image_url && typeof data.image_url === 'string') {
        imageUrl = data.image_url;
      } else {
        // Try to detect base64 image string somewhere in the JSON
        const findBase64 = (value: any): string | null => {
          if (!value) return null;
          if (typeof value === 'string') {
            const s = value.trim();
            if (
              s.length > 100 &&
              /^[A-Za-z0-9+/]+={0,2}$/.test(s.replace(/\s+/g, ''))
            ) {
              return s;
            }
          } else if (Array.isArray(value)) {
            for (const v of value) {
              const found = findBase64(v);
              if (found) return found;
            }
          } else if (typeof value === 'object') {
            for (const v of Object.values(value)) {
              const found = findBase64(v);
              if (found) return found;
            }
          }
          return null;
        };

        const base64 = findBase64(data);
        if (base64) {
          imageUrl = `data:image/png;base64,${base64.replace(/\s+/g, '')}`;
        } else if (data?.error) {
          throw new Error(
            `huggingface endpoint returned error JSON: ${String(data.error)}`,
          );
        } else {
          throw new Error(
            'unexpected JSON response from huggingface endpoint; no image found',
          );
        }
      }
    } else {
      throw new Error(
        `unexpected content-type from huggingface endpoint: ${contentType}`,
      );
    }

    return respData({
      prompt,
      imageUrl,
    });
  } catch (e: any) {
    console.error('hf-generate-image error', e);
    return respErr(e?.message || 'hf-generate-image failed');
  }
}
