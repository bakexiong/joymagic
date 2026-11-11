'use client';

import { useState, useCallback } from 'react';
import { Sparkles, Wand2, AlertCircle, Download, Info, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
import { useAppContext } from '@/shared/contexts/app';
import { PromptEnhanceButton } from '@/shared/components/prompt-enhance-button';
import { downloadFileFromUrl, ImagePreview } from '@/shared/lib/image-preview';
import { isTaskCompleted, isTaskFailed, isTaskProcessing } from '@/shared/lib/task-status';

// Constants
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 120; // 4 minutes max

// Helper functions
const extractWavespeedData = (result: any) => {
    if (result.code === 0 && result.data) {
        if (result.data.code === 200 && result.data.data) {
            return result.data.data;
        }
        if (result.data.requestId || result.data.id) {
            return result.data;
        }
    }
    return null;
};

const extractImageUrl = (data: any): string | null => {
    if (!data) return null;

    const url = data.outputs?.[0] ||
        data.output?.[0] ||
        data.image_url ||
        data.url ||
        data.output_url ||
        data.image ||
        data.result?.outputs?.[0] ||
        data.result?.output?.[0] ||
        data.result?.image_url ||
        data.result?.url;

    const extractedUrl = typeof url === 'string' ? url : null;
    console.log('Extracted image URL:', extractedUrl, 'from data:', data);
    return extractedUrl;
};

const extractRequestId = (data: any): string | null => {
    if (!data) return null;
    return data.requestId || data.id || data.request_id || null;
};

export function NanoBananaTextToImage({ className }: { className?: string }) {
    const { user } = useAppContext();

    const t = useTranslations('landing.nano-banana-text-to-image');
    const t2 = useTranslations('landing.wavespeed');
    const [prompt, setPrompt] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState('png');
    const { checkAccess, isCheckingGeo, isRestricted } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });

    // 使用 Hook 获取所需积分
    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('nano-banana-text-to-image');

    const callTextToImageAPI = async (promptText: string) => {
        const payload: any = {
            mediaType: 'image',
            prompt: promptText,
            enable_base64_output: false,
            enable_sync_mode: false,
            output_format: outputFormat,
        };

        const response = await fetch('/api/ai/nano-banana-text-to-image/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || t('errors.generationFailed'));
        }

        const result = await response.json();

        if (result.code !== 0) {
            throw new Error(result.message || t('errors.generationFailed'));
        }

        // Check for insufficient credits
        if (result.data?.success === false) {
            throw new Error(result.data.message || t('errors.generationFailed'));
        }

        return result;
    };

    const pollTaskStatus = async (requestId: string): Promise<string> => {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

            try {
                const statusResponse = await fetch(
                    `/api/ai/status?taskId=${requestId}&scenario=nano-banana-text-to-image`
                );

                if (!statusResponse.ok) {
                    const errorData = await statusResponse.json().catch(() => ({}));
                    console.warn(`[Polling] Status query failed (attempt ${attempt + 1}):`, statusResponse.status, errorData);
                    continue;
                }

                const statusResult = await statusResponse.json();

                if (statusResult.code !== 0) {
                    throw new Error(statusResult.message || t('errors.statusQueryFailed'));
                }

                const statusData = statusResult.data;
                if (!statusData) {
                    console.error('[Polling] Failed to parse status data:', statusResult);
                    throw new Error(statusResult.message || t('errors.statusQueryFailed'));
                }

                const taskStatus = statusData.status;
                console.log(`[Polling] Task ${requestId} status: ${taskStatus} (attempt ${attempt + 1})`, statusData);

                if (isTaskCompleted(taskStatus)) {
                    const imageUrl = statusData.output;
                    if (imageUrl) {
                        console.log('[Polling] Got result URL:', imageUrl);
                        return imageUrl;
                    }
                    console.warn('[Polling] No valid image URL found in response:', statusData);
                } else if (isTaskFailed(taskStatus)) {
                    const errorMsg = statusData.error || statusData.message || t('errors.taskFailed');
                    console.error('[Polling] Task failed:', errorMsg);
                    throw new Error(errorMsg);
                } else if (isTaskProcessing(taskStatus)) {
                    // Continue polling
                    continue;
                } else {
                    console.warn(`[Polling] Unknown status: ${taskStatus}, continuing...`);
                }
            } catch (err: any) {
                console.warn('[Polling] Error:', err);
                // Only throw if it's not a network error
                if (err.message && !err.message.includes('fetch')) {
                    throw err;
                }
            }
        }

        throw new Error(t('errors.taskTimeout'));
    };

    const startGenerate = async () => {
        // Validate access
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }

        // Validate inputs
        if (!prompt || !prompt.trim()) {
            setError(t('errors.promptRequired'));
            return;
        }

        // Reset state
        setIsGenerating(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            // Step 1: Call text-to-image API
            const result = await callTextToImageAPI(prompt.trim());
            console.log('Generation result:', result);

            // Step 2: Extract wavespeed data
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) {
                throw new Error(result.message || t('errors.apiResponseParseFailed'));
            }

            // Step 3: Check for direct image URL (synchronous result)
            console.log('Wavespeed data:', wavespeedData);
            const directImageUrl = extractImageUrl(wavespeedData);
            console.log('Direct image URL:', directImageUrl);
            if (directImageUrl) {
                console.log('Setting direct image URL:', directImageUrl);
                setGeneratedImageUrl(directImageUrl);
                return;
            }

            // Step 4: Poll for async result
            const requestId = extractRequestId(wavespeedData);
            console.log('Request ID:', requestId);
            if (!requestId) {
                console.error('No request ID found in wavespeed data:', wavespeedData);
                throw new Error(t('errors.taskIdNotFound'));
            }

            console.log('Starting to poll task status for requestId:', requestId);
            const finalImageUrl = await pollTaskStatus(requestId);
            console.log('Final image URL from polling:', finalImageUrl);
            setGeneratedImageUrl(finalImageUrl);
        } catch (err: any) {
            console.error('Generation failed:', err);
            setError(err.message || t('errors.processingFailed'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async (imageUrl: string) => {
        try {
            await downloadFileFromUrl(imageUrl, outputFormat);
        } catch (err) {
            console.error('Download failed:', err);
            setError(t('errors.downloadFailed'));
        }
    };

    return (
        <div className={cn('grid gap-6 lg:grid-cols-[1.05fr_1fr] items-stretch', className)}>
            {/* 左侧步骤 */}
            <div className="relative flex flex-col min-h-0">
                <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                    {/* Step 1: Enter Prompt */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                1
                            </span>
                            {t('steps.prompt.title')}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t('steps.prompt.hint')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="mt-2">
                            <Textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t('steps.prompt.placeholder')}
                                className="min-h-[120px] resize-none"
                                disabled={isGenerating}
                            />
                            <div className="flex justify-end mt-1.5">
                                <PromptEnhanceButton
                                    prompt={prompt}
                                    onEnhanced={setPrompt}
                                    disabled={isGenerating}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Settings */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                2
                            </span>
                            {t('steps.settings.title')}
                        </div>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="text-xs text-muted-foreground mb-1.5 block">
                                    {t('steps.settings.outputFormat')}
                                </label>
                                <Select value={outputFormat} onValueChange={setOutputFormat}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="png">PNG</SelectItem>
                                        <SelectItem value="jpeg">JPEG</SelectItem>
                                        <SelectItem value="webp">WEBP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Generate */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                3
                            </span>
                            {t('steps.generate.title')}
                        </div>
                        <Button
                            size="lg"
                            className="mt-3 w-full bg-gradient-to-r from-[#b08936] via-[#a15545] to-[#8a3b78] px-6 py-4 text-base font-semibold text-slate-900 shadow-[0_6px_22px_-6px_rgba(0,0,0,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.45)] disabled:opacity-70"
                            onClick={startGenerate}
                            disabled={isGenerating || !prompt.trim() || (!!user && (isEstimating || requiredCredits === null))}
                        >
                            {isEstimating ? (
                                <>
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                    <span>{t2('status.estimating', { defaultValue: 'Estimating...' })}</span>
                                </>
                            ) : isGenerating ? (
                                <>
                                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('steps.generate.generating')}
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    <span>
                                        {t('steps.generate.cta')}
                                        {!isGenerating && !isCheckingGeo && !isRestricted && !isEstimating && requiredCredits !== null && (
                                            <span className="ml-1.5 opacity-90">
                                                ({requiredCredits} {t2('buttons.credits', { defaultValue: 'credits' })})
                                            </span>
                                        )}
                                    </span>
                                </>
                            )}
                        </Button>
                        {estimateError && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="break-words">{t2('errors.estimate_failed', { defaultValue: 'Failed to estimate credits' })}: {estimateError}</span>
                            </div>
                        )}
                        {error && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>{error}</span>
                            </div>
                        )}
                        <div className="mt-2">
                            <PaymentButton
                                minCredits={requiredCredits ?? 999}
                                buttonText={t2('buttons.click_to_pay')}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 右侧预览 */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl lg:p-4 flex flex-col min-h-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 flex-shrink-0">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t('preview.title')}
                    </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-transparent flex-1 min-h-0 flex flex-col">
                    <ImagePreview
                        src={generatedImageUrl}
                        alt={t('alt.generated')}
                        dialogAlt={t('alt.enlargedPreview')}
                        downloadTitle={t('download.title')}
                        onDownload={generatedImageUrl ? () => handleDownload(generatedImageUrl) : null}
                        placeholder={
                            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-0">
                                {isGenerating ? (
                                    <>
                                        <Wand2 className="h-8 w-8 animate-spin text-primary" />
                                        <p className="text-sm font-medium text-slate-300">
                                            {t('steps.generate.generating')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="h-8 w-8 text-slate-400" />
                                        <p className="text-sm font-medium text-slate-300">
                                            {t('preview.placeholder')}
                                        </p>
                                    </>
                                )}
                            </div>
                        }
                        className="relative overflow-hidden rounded-2xl bg-transparent flex-1 min-h-0 flex flex-col"
                        containerClassName="rounded-xl min-h-[400px]"
                        imageClassName="max-h-[600px]"
                    />
                </div>
            </div>
        </div>
    );
}
