import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAppContext } from '@/shared/contexts/app';
import { getUserGeoLocation } from '@/shared/lib/geo';

export interface AccessCheckResult {
    /** 是否通过检查 */
    passed: boolean;
    /** 失败原因 */
    reason?: 'not_logged_in' | 'restricted';
    /** 错误消息（如果有） */
    errorMessage?: string;
}

export interface UseUserAccessCheckOptions {
    /** 错误消息的翻译 key 前缀，默认为 'errors' */
    errorTranslationKey?: string;
    /** 是否在挂载时自动检查地理位置，默认为 true */
    checkGeoOnMount?: boolean;
}

/**
 * 统一的用户访问检查 Hook
 * 
 * 用于检查用户是否已登录以及是否来自受限国家
 * 
 * @example
 * ```tsx
 * const { checkAccess, isRestricted, isCheckingGeo } = useUserAccessCheck();
 * 
 * const handleAction = async () => {
 *   const result = checkAccess();
 *   if (!result.passed) {
 *     // 检查失败，result.reason 会说明原因
 *     return;
 *   }
 *   // 继续执行操作
 * };
 * ```
 */
export function useUserAccessCheck(
    options: UseUserAccessCheckOptions = {}
) {
    const { errorTranslationKey = 'errors', checkGeoOnMount = true } = options;
    const { user, setIsShowSignModal } = useAppContext();
    const t = useTranslations();
    const [isRestricted, setIsRestricted] = useState(false);
    const [isCheckingGeo, setIsCheckingGeo] = useState(checkGeoOnMount);

    // 检查地理位置（如果需要）
    useEffect(() => {
        if (!checkGeoOnMount) {
            setIsCheckingGeo(false);
            return;
        }

        const checkGeo = async () => {
            try {
                const location = await getUserGeoLocation();
                if (location?.isRestricted) {
                    setIsRestricted(true);
                }
            } catch (error) {
                console.error('Geo check failed:', error);
                // Fail open - allow access on error
            } finally {
                setIsCheckingGeo(false);
            }
        };

        checkGeo();
    }, [checkGeoOnMount]);

    /**
     * 检查用户访问权限
     * 
     * @param customErrorMessage 自定义错误消息（可选）
     * @returns AccessCheckResult 检查结果
     */
    const checkAccess = (
        customErrorMessage?: string
    ): AccessCheckResult => {
        // 检查用户是否登录
        if (!user) {
            setIsShowSignModal(true);
            return {
                passed: false,
                reason: 'not_logged_in',
            };
        }

        // 检查用户是否来自受限国家
        if (isRestricted) {
            const errorMsg =
                customErrorMessage ||
                t(`${errorTranslationKey}.restricted` as any);
            return {
                passed: false,
                reason: 'restricted',
                errorMessage: errorMsg,
            };
        }

        return {
            passed: true,
        };
    };

    /**
     * 手动检查地理位置（用于延迟检查的场景）
     */
    const checkGeoLocation = async () => {
        setIsCheckingGeo(true);
        try {
            const location = await getUserGeoLocation();
            if (location?.isRestricted) {
                setIsRestricted(true);
            }
        } catch (error) {
            console.error('Geo check failed:', error);
            // Fail open - allow access on error
        } finally {
            setIsCheckingGeo(false);
        }
    };

    return {
        /** 检查用户访问权限的函数 */
        checkAccess,
        /** 是否来自受限国家 */
        isRestricted,
        /** 是否正在检查地理位置 */
        isCheckingGeo,
        /** 手动检查地理位置 */
        checkGeoLocation,
        /** 当前用户 */
        user,
    };
}

