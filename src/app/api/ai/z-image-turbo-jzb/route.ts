import { respData, respErr } from '@/shared/lib/resp';

const Z_IMAGE_TURBO_ENDPOINT =
  process.env.Z_IMAGE_TURBO_ENDPOINT ||
  'https://z-image-turbo.aigc.it/v1/images/generations';

export async function POST(request: Request) {
  try {
    const { prompt, size } = await request.json();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('prompt is required');
    }

    const payload: Record<string, any> = {
      prompt: prompt.trim(),
      n: 1,
      response_format: 'b64_json',
    };

    if (size && typeof size === 'string') {
      payload.size = size;
    }

    const turboResponse = await fetch(Z_IMAGE_TURBO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      body: JSON.stringify(payload),
    });

    if (!turboResponse.ok) {
      let errorText = '';
      try {
        errorText = await turboResponse.text();
      } catch {
        // ignore
      }
      throw new Error(
        `z-image-turbo request failed: ${turboResponse.status} ${turboResponse.statusText}${
          errorText ? ` - ${errorText}` : ''
        }`
      );
    }

    const data = await turboResponse.json();
    const base64 =
      data?.data && Array.isArray(data.data) && data.data[0]?.b64_json;

    if (!base64 || typeof base64 !== 'string') {
      throw new Error('z-image-turbo response missing image data');
    }

    const normalizedBase64 = base64.replace(/\s+/g, '');
    const imageUrl = `data:image/png;base64,${normalizedBase64}`;

    return respData({
      prompt: payload.prompt,
      created: data?.created,
      imageBase64: normalizedBase64,
      imageUrl,
    });
  } catch (e: any) {
    console.error('z-image-turbo error', e);
    return respErr(e?.message || 'z-image-turbo failed');
  }
}
