import { envConfigs } from '@/config';
import { AIMediaType } from '@/extensions/ai';
import { getUuid } from '@/shared/lib/hash';
import { respData, respErr } from '@/shared/lib/resp';
import { createAITask, NewAITask } from '@/shared/models/ai_task';
import { getRemainingCredits } from '@/shared/models/credit';
import { getAllConfigsDirectly } from '@/shared/models/config';
import { getUserInfo, consumeFreeImageGeneration } from '@/shared/models/user';
import { getAIService } from '@/shared/services/ai';
import { detectDeviceType } from '@/shared/lib/device-detector';

function getWebhookProviderSlug(provider: string) {
  return provider.toLowerCase().includes('wavespeed') ? 'wavespeed' : provider;
}

export async function POST(request: Request) {
  try {
    let { provider, mediaType, model, prompt, options, scene } =
      await request.json();

    if (!provider || !mediaType || !model) {
      throw new Error('invalid params');
    }

    if (!prompt && !options) {
      throw new Error('prompt or options is required');
    }

    const aiService = await getAIService();

    // check generate type
    if (!aiService.getMediaTypes().includes(mediaType)) {
      throw new Error('invalid mediaType');
    }

    // check ai provider
    const aiProvider = aiService.getProvider(provider);
    if (!aiProvider) {
      throw new Error('invalid provider');
    }

    // get current user
    const user = await getUserInfo();
    if (!user) {
      throw new Error('no auth, please sign in');
    }

    // 检测设备类型
    const userAgent = request.headers.get('user-agent');
    const deviceType = detectDeviceType(userAgent);

    // todo: get cost credits from settings
    let costCredits = 2;
    let useFreeGeneration = false;

    if (mediaType === AIMediaType.IMAGE) {
      // generate image
      if (scene === 'image-to-image') {
        costCredits = 4;
      } else if (scene === 'text-to-image') {
        costCredits = 2;
      } else {
        throw new Error('invalid scene');
      }

      // Try to use free image generation first (only for text-to-image)
      if (scene === 'text-to-image') {
        const freeUsed = await consumeFreeImageGeneration(user.id);
        if (freeUsed) {
          useFreeGeneration = true;
          costCredits = 0; // No credit cost if using free generation
        }
      }
    } else if (mediaType === AIMediaType.MUSIC) {
      // generate music
      costCredits = 10;
      scene = 'text-to-music';
    } else {
      throw new Error('invalid mediaType');
    }

    // If not using free generation, check credits
    if (!useFreeGeneration && costCredits > 0) {
      const remainingCredits = await getRemainingCredits(user.id);
      if (remainingCredits < costCredits) {
        throw new Error('insufficient credits');
      }
    }

    const configs = await getAllConfigsDirectly();
    const callbackBaseUrl = (
      configs.ai_webhook_base_url ||
      configs.app_url ||
      envConfigs.ai_webhook_base_url ||
      envConfigs.app_url ||
      new URL(request.url).origin ||
      ''
    ).replace(/\/+$/, '');
    const callbackUrl = `${callbackBaseUrl}/api/ai/notify/${getWebhookProviderSlug(provider)}`;

    const params: any = {
      mediaType,
      model,
      prompt,
      callbackUrl,
      options,
    };

    // generate content
    const result = await aiProvider.generate({ params });
    if (!result?.taskId) {
      throw new Error(
        `ai generate failed, mediaType: ${mediaType}, provider: ${provider}, model: ${model}`
      );
    }

    // create ai task
    // Note: createAITask will handle credit consumption if costCredits > 0
    const newAITask: NewAITask = {
      id: getUuid(),
      userId: user.id,
      mediaType,
      provider,
      model,
      prompt,
      scene,
      options: options ? JSON.stringify(options) : null,
      status: result.taskStatus,
      costCredits: useFreeGeneration ? 0 : costCredits, // Record 0 if using free generation, so no credits will be consumed
      taskId: result.taskId,
      taskInfo: result.taskInfo ? JSON.stringify(result.taskInfo) : null,
      taskResult: result.taskResult ? JSON.stringify(result.taskResult) : null,
      deviceType, // 记录设备类型
      userAgent: userAgent || undefined, // 记录完整的 User-Agent
    };
    await createAITask(newAITask);

    // 只返回 /api/ai/status 轮询所需的参数
    return respData({
      taskId: result.taskId,
      requestId: result.taskId, // 兼容前端 extractRequestId 使用的 requestId
    });
  } catch (e: any) {
    console.log('generate failed', e);
    return respErr(e.message);
  }
}
