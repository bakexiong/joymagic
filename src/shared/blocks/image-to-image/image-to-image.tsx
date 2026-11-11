'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Images, Sparkles, Wand2, AlertCircle, Trash2, FileImage, Download, RefreshCw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import { Textarea } from '@/shared/components/ui/textarea';
import {
    Dialog,
    DialogContent,
} from '@/shared/components/ui/dialog';
import { createOptimizedPreviewUrl, createRandomDownloadName, downloadOriginalFile, revokeObjectUrl } from '@/shared/lib/image-preview';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
import { useAppContext } from '@/shared/contexts/app';
import { PromptEnhanceButton } from '@/shared/components/prompt-enhance-button';
import { imageToImagePrompts } from '@/data/image-prompts';
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
        data.image_url ||
        data.url ||
        data.output_url ||
        data.image;

    return typeof url === 'string' ? url : null;
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

export function ImageToImage({ className }: { className?: string }) {
    const { user } = useAppContext();

    const t = useTranslations('landing.image-to-image.imageToImage');
    const t2 = useTranslations('landing.wavespeed');
    const locale = useLocale();
    const isChineseLocale = locale?.startsWith('zh');
    const [sourceImageName, setSourceImageName] = useState('');
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(true);
    const [sliderPosition, setSliderPosition] = useState(50); // 0-100, 50 表示中间
    const [isSliderDragging, setIsSliderDragging] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const [templateScrollLeft, setTemplateScrollLeft] = useState(0);
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const templateScrollRef = useRef<HTMLDivElement | null>(null);
    const sourceImageInputRef = useRef<HTMLInputElement | null>(null);
    const sourceImageFileRef = useRef<File | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const { checkAccess } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });
    
    // 使用 Hook 获取所需积分
    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('image-to-image');

    const handleUploadClick = () => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }
        sourceImageInputRef.current?.click();
    };

    const processFile = async (file: File) => {
        const url = await createOptimizedPreviewUrl(file);
        revokeObjectUrl(sourceImagePreview);
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
        // 只有当离开整个拖拽区域时才取消高亮
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
        revokeObjectUrl(sourceImagePreview);
        setSourceImagePreview(null);
        setSourceImageName('');
        sourceImageFileRef.current = null;
        setGeneratedImageUrl(null);
        if (sourceImageInputRef.current) {
            sourceImageInputRef.current.value = '';
        }
        setError(null);
    };

    const handleDownloadOriginal = () => {
        if (!sourceImageFileRef.current) return;
        downloadOriginalFile(sourceImageFileRef.current, sourceImageName || 'source-image');
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

    const callImageToImageAPI = async (imageUrl: string, prompt: string) => {
        const response = await fetch('/api/ai/image-to-image/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                mediaType: 'image',
                image: imageUrl,
                prompt: prompt.trim(),
                output_format: 'jpeg',
                seed: -1,
            }),
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
                    `/api/ai/status?taskId=${requestId}&scenario=image-to-image`
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

        const trimmedPrompt = prompt.trim();
        if (!trimmedPrompt) {
            setError(t('errors.promptRequired'));
            return;
        }

        // Reset state
        setIsGenerating(true);
        setError(null);
        setGeneratedImageUrl(null);
        setShowOriginal(true);

        try {
            // Step 1: Upload source image
            const sourceImageUrl = await uploadFile(sourceImageFileRef.current);
            console.log('Source image uploaded:', sourceImageUrl);

            // Step 2: Call image-to-image API
            const result = await callImageToImageAPI(sourceImageUrl, trimmedPrompt);
            console.log('Generation result:', result);

            // Step 3: Extract wavespeed data
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) {
                throw new Error(result.message || t('errors.apiResponseParseFailed'));
            }

            // Step 4: Check for direct image URL (synchronous result)
            const directImageUrl = extractImageUrl(wavespeedData);
            if (directImageUrl) {
                setGeneratedImageUrl(directImageUrl);
                return;
            }

            // Step 5: Poll for async result
            const requestId = extractRequestId(wavespeedData);
            if (!requestId) {
                throw new Error(t('errors.taskIdNotFound'));
            }

            const finalImageUrl = await pollTaskStatus(requestId);
            setGeneratedImageUrl(finalImageUrl);
            // 重置滑动条位置到左侧（显示原图）
            setSliderPosition(0);
            // 触发渐变切换效果
            setShowTransition(true);
            setTimeout(() => {
                setShowTransition(false);
                // 自动滑动到中间位置展示对比效果
                setSliderPosition(50);
            }, 500);
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
            link.download = createRandomDownloadName('jpg');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            setError('Failed to download image');
        }
    };

    const handleSliderMouseDown = (e: React.MouseEvent) => {
        setIsSliderDragging(true);
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSliderAreaClick = (e: React.MouseEvent) => {
        // 如果正在拖动，不处理点击事件
        if (isSliderDragging || !sliderRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    };

    const handleSliderMouseMove = useCallback((e: MouseEvent) => {
        if (!isSliderDragging || !sliderRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = sliderRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    }, [isSliderDragging]);

    const handleSliderMouseUp = useCallback(() => {
        setIsSliderDragging(false);
    }, []);

    const handleSliderTouchStart = (e: React.TouchEvent) => {
        setIsSliderDragging(true);
        e.preventDefault();
        e.stopPropagation();
    };

    const handleSliderTouchMove = useCallback((e: TouchEvent) => {
        if (!isSliderDragging || !sliderRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = sliderRef.current.getBoundingClientRect();
        const touch = e.touches[0] || e.changedTouches[0];
        const x = touch.clientX - rect.left;
        const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
        setSliderPosition(percentage);
    }, [isSliderDragging]);

    const handleSliderTouchEnd = useCallback(() => {
        setIsSliderDragging(false);
    }, []);

    // 处理模板图片点击，填充提示词
    const handleTemplateClick = (promptText: string) => {
        setPrompt(promptText);
    };

    // 获取 hot 分类的模板图片（优先显示有缩略图的提示词）
    const templateItems = (() => {
        const hotCategory = imageToImagePrompts.find(category => category.id === 'hot');
        if (!hotCategory) return [];

        const itemsWithThumbnail = hotCategory.prompts.filter(item => item.thumbnail);
        const itemsWithoutThumbnail = hotCategory.prompts.filter(item => !item.thumbnail).slice(0, 2); // 没有缩略图的只取前2个作为补充

        return [...itemsWithThumbnail, ...itemsWithoutThumbnail].map(item => ({
            ...item,
            categoryId: hotCategory.id,
            categoryName: isChineseLocale ? hotCategory.name : hotCategory.nameEn,
        }));
    })();

    // 添加全局鼠标和触摸事件监听
    useEffect(() => {
        return () => {
            revokeObjectUrl(sourceImagePreview);
        };
    }, [sourceImagePreview]);

    useEffect(() => {
        if (isSliderDragging) {
            document.addEventListener('mousemove', handleSliderMouseMove);
            document.addEventListener('mouseup', handleSliderMouseUp);
            document.addEventListener('touchmove', handleSliderTouchMove, { passive: false });
            document.addEventListener('touchend', handleSliderTouchEnd);
            return () => {
                document.removeEventListener('mousemove', handleSliderMouseMove);
                document.removeEventListener('mouseup', handleSliderMouseUp);
                document.removeEventListener('touchmove', handleSliderTouchMove);
                document.removeEventListener('touchend', handleSliderTouchEnd);
            };
        }
    }, [isSliderDragging, handleSliderMouseMove, handleSliderMouseUp, handleSliderTouchMove, handleSliderTouchEnd]);

    return (
        <div className={cn('grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1.05fr_1fr] items-start lg:items-stretch w-full max-w-full overflow-x-hidden', className)}>
            {/* 左侧步骤 */}
            <div className="relative flex flex-col w-full max-w-full lg:min-h-0">
                <div className="space-y-3 md:space-y-4 w-full max-w-full lg:flex-1 lg:overflow-y-auto lg:min-h-0">
                    {/* Step 1: Upload Source Image */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                1
                            </span>
                            {t('steps.sourceImage.title')}
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
                                    "relative rounded-lg md:rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[120px] md:min-h-[140px] transition-all cursor-pointer w-full max-w-full",
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
                                            alt="Source preview"
                                            className="w-full h-full object-contain max-h-[200px] md:max-h-[250px]"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7 md:h-8 md:w-8 bg-red-500/80 hover:bg-red-600/90 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete();
                                            }}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-center p-3 md:p-4">
                                        {isDragging ? (
                                            <>
                                                <FileImage className="h-10 w-10 md:h-12 md:w-12 text-primary animate-bounce" />
                                                <p className="text-xs md:text-sm font-medium text-primary">
                                                    {t('steps.sourceImage.dropHere')}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <FileImage className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground" />
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

                    {/* Step 2: Enter Prompt */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">
                                2
                            </span>
                            {t('steps.prompt.title')}
                        </div>
                        <div className="mt-2 w-full max-w-full">
                            <Textarea
                                placeholder={t('steps.prompt.placeholder')}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[80px] md:min-h-[100px] resize-none text-sm w-full max-w-full"
                            />
                            <div className="flex justify-end mt-1.5">
                                <PromptEnhanceButton
                                    prompt={prompt}
                                    onEnhanced={setPrompt}
                                    disabled={isGenerating}
                                />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                {t('steps.prompt.hint')}
                            </p>
                        </div>
                    </div>

                    {/* Step 3: Generate */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">
                                3
                            </span>
                            {t('steps.generate.title')}
                        </div>
                        <Button
                            size="lg"
                            className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                            onClick={startGenerate}
                            disabled={isGenerating || !sourceImageFileRef.current || !prompt.trim() || (!!user && (isEstimating || requiredCredits === null))}
                        >
                            {isGenerating ? (
                                <>
                                    <Wand2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                    <span className="text-xs md:text-sm">{t('steps.generate.generating')}</span>
                                </>
                            ) : isEstimating ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                                    <span className="text-xs md:text-sm">{t2('status.estimating', { defaultValue: 'Estimating credits...' })}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                                    <span className="text-xs md:text-sm">
                                        {t('steps.generate.cta')}
                                        <span className="ml-1.5 opacity-90">
                                            ({requiredCredits} {t2('buttons.credits', { defaultValue: 'credits' })})
                                        </span>
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
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="break-words">{error}</span>
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
            <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl lg:p-4 flex flex-col w-full max-w-full lg:min-h-0">
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-2 flex-shrink-0 w-full">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        {t('preview.title')}
                    </span>
                </div>

                <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-transparent lg:flex-1 min-h-0 flex flex-col w-full max-w-full">
                    {sourceImagePreview ? (
                        generatedImageUrl ? (
                            // 生成图完成后显示滑动条对比视图
                            <div
                                ref={sliderRef}
                                className="relative flex-1 overflow-hidden rounded-lg md:rounded-xl flex-shrink-0 bg-black/20 min-h-[300px] md:min-h-[400px] cursor-col-resize select-none"
                                onMouseDown={handleSliderAreaClick}
                                onTouchStart={handleSliderTouchStart}
                            >
                                {/* 原图 - 底层 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img
                                        src={sourceImagePreview}
                                        alt="Source"
                                        className="w-full h-auto max-h-[400px] md:max-h-[600px] object-contain"
                                    />
                                    {/* Swap 标签浮层 - 显示在原图上 */}
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] md:text-xs font-medium text-white/90 z-20 pointer-events-none">
                                        {t('preview.swap')}
                                    </div>
                                </div>
                                {/* 生成图 - 上层，通过 clip-path 控制显示 */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center"
                                    style={{
                                        clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                                        opacity: showTransition ? 0 : 1,
                                        transition: isSliderDragging ? 'none' : 'opacity 0.3s ease-out',
                                    }}
                                >
                                    <img
                                        src={generatedImageUrl}
                                        alt="Generated"
                                        className="w-full h-auto max-h-[400px] md:max-h-[600px] object-contain"
                                    />
                                    {/* Original 标签浮层 - 显示在生成图上 */}
                                    <div className="absolute top-2 right-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] md:text-xs font-medium text-white/90 z-20 pointer-events-none">
                                        {t('preview.original')}
                                    </div>
                                </div>
                                {/* 滑动条 */}
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-white/90 z-30 cursor-col-resize shadow-lg pointer-events-none"
                                    style={{
                                        left: `${sliderPosition}%`,
                                        transform: 'translateX(-50%)',
                                        transition: isSliderDragging ? 'none' : 'left 0.1s ease-out',
                                    }}
                                >
                                    <div
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-white border-2 border-gray-400 shadow-xl flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto cursor-col-resize"
                                        onMouseDown={handleSliderMouseDown}
                                    >
                                        <div className="flex gap-0.5">
                                            <div className="w-0.5 h-2.5 md:h-3 bg-gray-500 rounded-full" />
                                            <div className="w-0.5 h-2.5 md:h-3 bg-gray-500 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                                {/* 下载按钮浮层 */}
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-2 left-2 h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadOriginal();
                                    }}
                                    title="Download original image"
                                >
                                    <Download className="h-3 w-3 md:h-4 md:w-4 text-white/90" />
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-2 right-2 h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownload(generatedImageUrl);
                                    }}
                                    title="Download image"
                                >
                                    <Download className="h-3 w-3 md:h-4 md:w-4 text-white/90" />
                                </Button>
                            </div>
                        ) : (
                            // 默认显示原图
                            <div className="relative flex-1 overflow-hidden rounded-lg md:rounded-xl flex-shrink-0 bg-black/20 min-h-[300px] md:min-h-[400px] flex items-center justify-center cursor-pointer group" onClick={() => setEnlargedImage(sourceImagePreview)}>
                                <img
                                    src={sourceImagePreview}
                                    alt="Source"
                                    className="w-full h-auto max-h-[400px] md:max-h-[600px] object-contain transition-opacity group-hover:opacity-90"
                                />
                                {/* Swap 标签浮层 */}
                                <div className="absolute top-2 left-2 px-1.5 py-0.5 md:px-2 md:py-1 rounded-md bg-black/60 backdrop-blur-sm text-[10px] md:text-xs font-medium text-white/90 z-20 pointer-events-none">
                                    {t('preview.swap')}
                                </div>
                                {/* 生成中提示 */}
                                {isGenerating && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                                        <div className="flex flex-col items-center gap-2">
                                            <Wand2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                                            <span className="text-xs text-white/90">{t('steps.generate.generating')}</span>
                                        </div>
                                    </div>
                                )}
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-2 right-2 h-7 w-7 md:h-8 md:w-8 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 z-20"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadOriginal();
                                    }}
                                    title="Download original image"
                                >
                                    <Download className="h-3 w-3 md:h-4 md:w-4 text-white/90" />
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-[300px] md:min-h-[400px]">
                            <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-slate-400" />
                            <p className="text-xs md:text-sm font-medium text-slate-300 px-4">
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
                                alt="Enlarged preview"
                                className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* 模板区域 - 底部 */}
            {templateItems.length > 0 && (
                <div className="lg:col-span-2 mt-4">
                    <div className="rounded-2xl border border-white/10 bg-card/60 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-semibold text-foreground">
                                {t('templates.title')}
                            </h3>
                        </div>
                        <div
                            ref={templateScrollRef}
                            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                            style={{
                                scrollBehavior: 'smooth',
                            }}
                            onScroll={(e) => {
                                setTemplateScrollLeft(e.currentTarget.scrollLeft);
                            }}
                        >
                            {templateItems.map((item, index) => (
                                <div
                                    key={`${item.categoryName}-${index}`}
                                    className="flex-shrink-0 cursor-pointer group"
                                    onClick={() => handleTemplateClick(item.text)}
                                >
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-primary transition-all group-hover:scale-105">
                                        {item.thumbnail ? (
                                            <img
                                                src={item.thumbnail}
                                                alt={item.text}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                                <FileImage className="h-8 w-8 text-primary/50" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute bottom-0 left-0 right-0 p-2 text-xs text-white/90 opacity-0 group-hover:opacity-100 transition-opacity line-clamp-2">
                                            {item.text.substring(0, 60)}...
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
