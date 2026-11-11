'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseEstimateCreditsOptions {
    enabled?: boolean;
    debounceMs?: number;
    requireAuth?: boolean;
    disableCache?: boolean;
}

interface UseEstimateCreditsResult {
    credits: number | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

// 简单的内存缓存
const cache = new Map<string, { credits: number; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 分钟

/**
 * 生成缓存 key
 */
function generateCacheKey(apiKey: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) {
        return apiKey;
    }
    // 对参数进行排序，确保相同参数生成相同的 key
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${JSON.stringify(params[key])}`)
        .join('&');
    return `${apiKey}?${sortedParams}`;
}

/**
 * 从缓存获取积分
 */
function getCachedCredits(key: string): number | null {
    const cached = cache.get(key);
    if (!cached) {
        return null;
    }
    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
        cache.delete(key);
        return null;
    }
    return cached.credits;
}

/**
 * 设置缓存
 */
function setCachedCredits(key: string, credits: number): void {
    cache.set(key, { credits, timestamp: Date.now() });
}

/**
 * 统一的前端积分计算 Hook
 *
 * @param apiKey - 场景名称（如 'image-to-image', 'text-to-video/ltx-2-fast' 等）
 * @param params - 动态参数（如 duration, resolution, generate_audio 等）
 * @param options - 选项（enabled: 是否启用，debounceMs: 防抖时间）
 * @returns 积分值、加载状态、错误信息和重试函数
 *
 * @example
 * // 固定积分场景
 * const { credits } = useEstimateCredits('image-to-image');
 *
 * @example
 * // 动态积分场景
 * const { credits, isLoading } = useEstimateCredits('text-to-video/ltx-2-fast', {
 *   duration: 5,
 *   generate_audio: true
 * });
 */
export function useEstimateCredits(
    apiKey: string,
    params?: Record<string, unknown>,
    options: UseEstimateCreditsOptions = {}
): UseEstimateCreditsResult {
    const {
        enabled = true,
        debounceMs = 300,
        requireAuth = false,
        disableCache = false,
    } = options;
    const [credits, setCredits] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // 用 ref 保存最新的 params，避免 fetchCredits 闭包捕获旧值（stale closure）
    const paramsRef = useRef(params);
    useEffect(() => {
        paramsRef.current = params;
    }, [params]);

    // 生成缓存 key
    const cacheKey = generateCacheKey(apiKey, params);

    // 调用 API 获取积分
    // 注意：此函数不应直接引用 params，而是通过 paramsRef.current 读取最新值，
    // 否则当 cacheKey 变化（params 已更新）但 debounce 尚未触发时，
    // fetchCreditsRef.current 调用此函数会用旧的 params 值发请求。
    const fetchCredits = useCallback(async (signal: AbortSignal, currentCacheKey: string) => {
        const currentParams = paramsRef.current;

        // 先检查缓存
        if (!disableCache) {
            const cached = getCachedCredits(currentCacheKey);
            if (cached !== null) {
                setCredits(cached);
                setIsLoading(false);
                setError(null);
                return;
            }
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/estimate-credits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    apiKey,
                    params: currentParams || {},
                }),
                signal,
            });

            if (signal.aborted) {
                return;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }

            const result = await response.json();

            if (result.code !== 0) {
                throw new Error(result.message || 'Failed to estimate credits');
            }

            const requiredCredits = result.data?.requiredCredits;
            if (typeof requiredCredits !== 'number') {
                throw new Error('Invalid response format');
            }

            // 缓存结果
            if (!disableCache) {
                setCachedCredits(currentCacheKey, requiredCredits);
            }
            setCredits(requiredCredits);
            setError(null);
        } catch (e: unknown) {
            if (signal.aborted) {
                return;
            }
            const message = e instanceof Error ? e.message : 'Failed to estimate credits';
            console.error('[useEstimateCredits] Failed to estimate credits:', e);
            setError(message);
            // 发生错误时，将积分设为 null，防止使用旧的（可能不准确的）积分值
            setCredits(null);
        } finally {
            if (!signal.aborted) {
                setIsLoading(false);
            }
        }
    }, [apiKey, disableCache]);

    // 使用 useRef 存储最新的 fetchCredits，避免作为依赖项
    const fetchCreditsRef = useRef(fetchCredits);
    useEffect(() => {
        fetchCreditsRef.current = fetchCredits;
    }, [fetchCredits]);

    // 当 apiKey 或 params 变化时，触发防抖获取
    useEffect(() => {
        // 如果需要认证但未启用，则不请求
        if (!enabled || !apiKey || requireAuth) {
            setCredits(null);
            setIsLoading(false);
            setError(null);
            return;
        }

        // 先检查缓存
        if (!disableCache) {
            const cached = getCachedCredits(cacheKey);
            if (cached !== null) {
                setCredits(cached);
                setIsLoading(false);
                setError(null);
                return;
            }
        }

        // 取消之前的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 清除之前的防抖定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // 创建新的 AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 设置防抖
        debounceTimerRef.current = setTimeout(() => {
            if (enabled && apiKey) {
                // 传递最新的 cacheKey，确保缓存检查和请求使用一致的 key
                fetchCreditsRef.current(controller.signal, cacheKey);
            }
        }, debounceMs);

        // 清理函数
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [enabled, apiKey, cacheKey, debounceMs, requireAuth, disableCache]);

    // 手动重试函数
    const refetch = useCallback(() => {
        // 允许未登录用户调用
        if (!enabled || !apiKey) {
            return;
        }

        // 清除缓存
        cache.delete(cacheKey);

        // 取消之前的请求
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // 清除之前的防抖定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // 创建新的 AbortController
        const controller = new AbortController();
        abortControllerRef.current = controller;

        // 立即触发获取（不使用防抖）
        if (enabled && apiKey) {
            fetchCreditsRef.current(controller.signal, cacheKey);
        }
    }, [cacheKey, enabled, apiKey]);

    return {
        credits,
        isLoading,
        error,
        refetch,
    };
}
