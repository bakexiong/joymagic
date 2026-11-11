'use client';

import { useRef, useState } from 'react';
import { Sparkles, Wand2, AlertCircle, Trash2, FileImage, Download, Info, RefreshCw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import { useAppContext } from '@/shared/contexts/app';
import {
    Dialog,
    DialogContent,
} from '@/shared/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
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

const parseStatusData = (statusResult: any) => {
    if (statusResult.code === 0 && statusResult.data) {
        if (statusResult.data.code === 200 && statusResult.data.data) {
            return statusResult.data.data;
        }
        return statusResult.data;
    }
    return null;
};

export function ImageBackgroundRemover({ className }: { className?: string }) {
    const { user } = useAppContext();
    const t = useTranslations('landing.image-background-remover.imageBackgroundRemover');
    const t2 = useTranslations('landing.wavespeed');
    const locale = useLocale();
    const [sourceImageName, setSourceImageName] = useState('');
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const sourceImageInputRef = useRef<HTMLInputElement | null>(null);
    const sourceImageFileRef = useRef<File | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const { checkAccess, isCheckingGeo, isRestricted } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });
    
    // 使用 Hook 获取所需积分
    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('image-background-remover');

    const handleUploadClick = () => {
        sourceImageInputRef.current?.click();
    };

    const processFile = async (file: File) => {
        const url = URL.createObjectURL(file);
        setSourceImageName(file.name);
        setSourceImagePreview(url);
        sourceImageFileRef.current = file;
        setGeneratedImageUrl(null);
        setError(null);
    };

    const handleFileChange = async (fileList: FileList | null) => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }
        if (!fileList || fileList.length === 0) return;
        const file = fileList[0];

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            setError(t('errors.invalidFileType'));
            return;
        }

        await processFile(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragging) {
            setIsDragging(true);
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        const file = files[0];

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            setError(t('errors.invalidFileType'));
            return;
        }

        await processFile(file);
    };

    const handleDelete = () => {
        if (sourceImagePreview) {
            URL.revokeObjectURL(sourceImagePreview);
        }
        setSourceImagePreview(null);
        setSourceImageName('');
        sourceImageFileRef.current = null;
        setGeneratedImageUrl(null);
        if (sourceImageInputRef.current) {
            sourceImageInputRef.current.value = '';
        }
        setError(null);
    };

    const uploadFile = async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch('/api/storage/upload-image', {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            throw new Error(t('errors.uploadFailed', { error: response.statusText }));
        }

        const result = await response.json();
        if (result.code !== 0 || !result.data?.urls?.length) {
            throw new Error(result.message || t('errors.uploadFailedGeneric'));
        }

        return result.data.urls[0] as string;
    };

    const callBackgroundRemoverAPI = async (imageUrl: string) => {
        const payload: any = {
            mediaType: 'image',
            image: imageUrl,
            enable_base64_output: false,
            enable_sync_mode: false,
        };

        const response = await fetch('/api/ai/image-background-remover/generate', {
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
                    `/api/ai/status?taskId=${requestId}&scenario=image-background-remover`
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
        if (!sourceImageFileRef.current) {
            setError(t('errors.sourceImageRequired'));
            return;
        }

        // Reset state
        setIsGenerating(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            // Step 1: Upload source image
            const sourceImageUrl = await uploadFile(sourceImageFileRef.current);
            console.log('Source image uploaded:', sourceImageUrl);

            // Step 2: Call background-remover API
            const result = await callBackgroundRemoverAPI(sourceImageUrl);
            console.log('Generation result:', result);

            // Step 3: Extract wavespeed data
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) {
                throw new Error(result.message || t('errors.apiResponseParseFailed'));
            }

            // Step 4: Check for direct image URL (synchronous result)
            console.log('Wavespeed data:', wavespeedData);
            const directImageUrl = extractImageUrl(wavespeedData);
            console.log('Direct image URL:', directImageUrl);
            if (directImageUrl) {
                console.log('Setting direct image URL:', directImageUrl);
                setGeneratedImageUrl(directImageUrl);
                return;
            }

            // Step 5: Poll for async result
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
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `background-removed-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
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
                    {/* Step 1: Upload Source Image */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                1
                            </span>
                            {t('steps.sourceImage.title')}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t('steps.sourceImage.hint')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="mt-2">
                            <p className="text-muted-foreground mb-1 text-xs">
                                {t('steps.sourceImage.hint')}
                            </p>
                            <p className="text-xs text-foreground/80 mb-2">
                                {sourceImageName ? t('common.selected', { name: sourceImageName }) : t('common.notSelected')}
                            </p>
                            <div
                                ref={dropZoneRef}
                                onDragOver={handleDragOver}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={handleUploadClick}
                                className={cn(
                                    "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[140px] transition-all cursor-pointer",
                                    isDragging
                                        ? "border-primary bg-primary/10 scale-[1.02]"
                                        : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                                    sourceImagePreview && "border-solid cursor-default"
                                )}
                            >
                                {sourceImagePreview ? (
                                    <>
                                        <img
                                            src={sourceImagePreview}
                                            alt={t('alt.sourcePreview')}
                                            className="w-full h-full object-contain max-h-[250px]"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 hover:bg-red-600/90 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                                        {isDragging ? (
                                            <>
                                                <FileImage className="h-12 w-12 text-primary animate-bounce" />
                                                <p className="text-sm font-medium text-primary">
                                                    {t('steps.sourceImage.dropHere')}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <FileImage className="h-12 w-12 text-muted-foreground" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {t('steps.sourceImage.dragDrop')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('steps.sourceImage.hint')}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                ref={sourceImageInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files)}
                            />
                        </div>
                    </div>

                    {/* Step 2: Generate */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                2
                            </span>
                            {t('steps.generate.title')}
                        </div>
                        <Button
                            size="lg"
                            className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                            onClick={startGenerate}
                            disabled={isGenerating || !sourceImageFileRef.current || (!!user && isEstimating)}
                        >
                            {isEstimating ? (
                                <>
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                    <span>{t2('status.estimating', { defaultValue: 'Estimating credits...' })}</span>
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
                    {sourceImagePreview ? (
                        generatedImageUrl ? (
                            // 直接显示移除背景后的图片
                            <div className="relative flex-1 overflow-hidden rounded-xl flex-shrink-0 bg-black/20 min-h-[400px] flex items-center justify-center cursor-pointer group" onClick={() => setEnlargedImage(generatedImageUrl)}>
                                {/* 添加棋盘背景以显示透明区域 */}
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,#808080_25%,transparent_25%),linear-gradient(-45deg,#808080_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#808080_75%),linear-gradient(-45deg,transparent_75%,#808080_75%)] bg-[length:20px_20px] bg-[0_0,0_10px,10px_-10px,-10px_0px] opacity-30" />
                                <img
                                    src={generatedImageUrl}
                                    alt={t('alt.generated')}
                                    className="w-full h-auto max-h-[600px] object-contain relative z-10 transition-opacity group-hover:opacity-90"
                                    onError={(e) => {
                                        console.error('Failed to load generated image:', generatedImageUrl);
                                        setError(t('errors.downloadFailed'));
                                    }}
                                />
                                {/* Background Removed 标签浮层 */}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium text-white/90 z-20 pointer-events-none">
                                    {t('preview.backgroundRemoved')}
                                </div>
                                {/* 下载按钮浮层 */}
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-2 right-2 h-8 w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(generatedImageUrl);
                                    }}
                                    title={t('download.title')}
                                >
                                    <Download className="h-3 w-3 text-white/90" />
                                </Button>
                            </div>
                        ) : (
                            // 默认显示原图
                            <div className="relative flex-1 overflow-hidden rounded-xl flex-shrink-0 bg-black/20 min-h-[400px] flex items-center justify-center cursor-pointer group" onClick={() => setEnlargedImage(sourceImagePreview)}>
                                <img
                                    src={sourceImagePreview}
                                    alt="Source"
                                    className="w-full h-auto max-h-[600px] object-contain transition-opacity group-hover:opacity-90"
                                />
                                {/* Original 标签浮层 */}
                                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium text-white/90 z-20 pointer-events-none">
                                    {t('preview.original')}
                                </div>
                                {/* 生成中提示 */}
                                {isGenerating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wand2 className="h-8 w-8 animate-spin text-primary" />
                                            <span className="text-xs text-white/90">{t('steps.generate.generating')}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    ) : (
                        <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-0">
                            <Wand2 className="h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium text-slate-300">
                                {t('preview.placeholder')}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 图片放大对话框 */}
            <Dialog open={Boolean(enlargedImage)} onOpenChange={(open) => !open && setEnlargedImage(null)}>
                <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/90 p-0">
                    {enlargedImage && (
                        <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4">
                            <img
                                src={enlargedImage}
                                alt={t('alt.enlargedPreview')}
                                className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
