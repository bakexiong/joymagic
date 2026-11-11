import {
    consumeCredits,
    createCredit,
    CreditStatus,
    CreditTransactionScene,
    CreditTransactionType,
    getRemainingCredits,
} from '@/shared/models/credit';
import { getUserInfo, consumeFreeImageGeneration, findUserById, updateUser } from '@/shared/models/user';
import { getSnowId, getUuid } from '@/shared/lib/hash';

export interface CreditCheckOptions {
    requiredCredits: number;
    scene: string;
    description: string;
    metadata?: Record<string, any>;
    freeGenerationKey?: 'freeImageGenerations' | 'freeVideoGenerations' | 'freeFaceSwapGenerations';
}

export interface CreditCheckResult {
    success: boolean;
    usedFreeGeneration: boolean;
    hasEnoughCredits: boolean;
    usedCredits?: number;
    remainingCredits: number;
    freeGenerations: number;
    message: string;
}

/**
 * 返还积分的通用逻辑（用于 API 请求失败时）
 * @param params
 *  - userId: 用户 ID
 *  - userEmail: 用户邮箱
 *  - freeUsed: 是否本次使用了免费次数
 *  - refundCredits: 需要返还的积分数量（当未使用免费次数时）
 *  - description: 返还记录描述
 */
export async function refundWavespeedCredits(params: {
    userId: string;
    userEmail: string;
    freeUsed: boolean;
    refundCredits: number;
    description?: string;
}) {
    const { userId, userEmail, freeUsed, refundCredits, description } = params;

    try {
        if (freeUsed) {
            // 返还免费图片生成次数
            const currentUser = await findUserById(userId);
            if (currentUser) {
                await updateUser(userId, {
                    freeImageGenerations: (currentUser.freeImageGenerations || 0) + 1,
                });
            }
        } else if (refundCredits > 0) {
            // 返还积分
            await createCredit({
                id: getUuid(),
                userId,
                userEmail,
                orderNo: '',
                subscriptionNo: '',
                transactionNo: getSnowId(),
                transactionType: CreditTransactionType.GRANT,
                transactionScene: CreditTransactionScene.REWARD,
                credits: refundCredits,
                remainingCredits: refundCredits,
                description: description || 'Refund for failed API request',
                expiresAt: null,
                status: CreditStatus.ACTIVE,
            });
        }
    } catch (e) {
        console.error('Failed to refund credits:', e);
    }
}

/**
 * 检查用户权限并消费免费次数或积分
 * 返回普通对象，不返回 Response
 */
export async function checkAndConsumeCredits(
    options: CreditCheckOptions
): Promise<{ code: number; message: string; data?: CreditCheckResult }> {
    try {
        const user = await getUserInfo();
        if (!user) {
            return { code: -1, message: 'no auth, please sign in' };
        }

        // 如果有免费次数，先尝试消费免费次数
        if (options.freeGenerationKey) {
            // 根据不同的免费次数类型调用不同的函数
            let freeUsed = false;

            if (options.freeGenerationKey === 'freeImageGenerations') {
                freeUsed = await consumeFreeImageGeneration(user.id);
            }
            // 可以在这里添加其他类型的免费次数消费逻辑
            // else if (options.freeGenerationKey === 'freeVideoGenerations') {
            //   freeUsed = await consumeFreeVideoGeneration(user.id);
            // }

            if (freeUsed) {
                const updatedUser = await findUserById(user.id);
                const remainingCredits = await getRemainingCredits(user.id);

                return {
                    code: 0,
                    message: 'ok',
                    data: {
                        success: true,
                        usedFreeGeneration: true,
                        hasEnoughCredits: true,
                        remainingCredits,
                        freeGenerations: options.freeGenerationKey === 'freeImageGenerations'
                            ? (updatedUser?.freeImageGenerations ?? 0)
                            : 0,
                        message: 'Free generation used',
                    },
                };
            }
        }

        // 没有免费次数，检查积分
        const remainingCredits = await getRemainingCredits(user.id);

        if (remainingCredits < options.requiredCredits) {
            const updatedUser = await findUserById(user.id);

            return {
                code: 0,
                message: 'ok',
                data: {
                    success: false,
                    usedFreeGeneration: false,
                    hasEnoughCredits: false,
                    remainingCredits,
                    freeGenerations: options.freeGenerationKey === 'freeImageGenerations'
                        ? (updatedUser?.freeImageGenerations ?? 0)
                        : 0,
                    message: 'Insufficient credits',
                },
            };
        }

        // 消费积分
        await consumeCredits({
            userId: user.id,
            credits: options.requiredCredits,
            scene: options.scene,
            description: options.description,
            metadata: JSON.stringify({
                ...options.metadata,
                provider: 'wavespeed',
            }),
        });

        // 获取更新后的用户信息
        const updatedUser = await findUserById(user.id);
        const updatedRemainingCredits = await getRemainingCredits(user.id);

        return {
            code: 0,
            message: 'ok',
            data: {
                success: true,
                usedFreeGeneration: false,
                hasEnoughCredits: true,
                usedCredits: options.requiredCredits,
                remainingCredits: updatedRemainingCredits,
                freeGenerations: options.freeGenerationKey === 'freeImageGenerations'
                    ? (updatedUser?.freeImageGenerations ?? 0)
                    : 0,
                message: 'Credits consumed',
            },
        };
    } catch (e: any) {
        console.error('Credit check failed:', e);
        return { code: -1, message: e.message || 'Failed to check credits' };
    }
}
