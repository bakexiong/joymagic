'use server';

import { CreditTransactionScene, consumeCredits } from '@/shared/models/credit';
import { getUserInfo } from '@/shared/models/user';

export async function consumeCreditsAction({
  credits,
  scene,
  description,
  metadata,
}: {
  credits: number;
  scene?: string;
  description?: string;
  metadata?: Record<string, any>;
}) {
  try {
    if (!credits || credits <= 0) {
      throw new Error('credits is required and must be greater than 0');
    }

    const user = await getUserInfo();
    if (!user) {
      throw new Error('no auth, please sign in');
    }

    const consumedCredit = await consumeCredits({
      userId: user.id,
      credits: credits,
      scene: scene || CreditTransactionScene.REWARD,
      description: description || `Consume ${credits} credits`,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    });

    return {
      success: true,
      data: consumedCredit,
    };
  } catch (e: any) {
    console.error('consume credits failed:', e);
    return {
      success: false,
      error: e.message || 'consume credits failed',
    };
  }
}

