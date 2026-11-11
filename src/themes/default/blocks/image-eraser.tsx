'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Wand2, AlertCircle, Trash2, FileImage, Download, Info, RefreshCw } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import { Textarea } from '@/shared/components/ui/textarea';
import { useAppContext } from '@/shared/contexts/app';
import {
    Dialog,
    DialogContent,
} from '@/shared/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/shared/components/ui/select';
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

export function ImageEraser({ className }: { className?: string }) {
    const { user } = useAppContext();
    const t = useTranslations('landing.image-eraser.imageEraser');
    const t2 = useTranslations('landing.wavespeed');
    const locale = useLocale();
    const [sourceImageName, setSourceImageName] = useState('');
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [maskImageName, setMaskImageName] = useState('');
    const [maskImagePreview, setMaskImagePreview] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [outputFormat, setOutputFormat] = useState('jpeg');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isMaskDragging, setIsMaskDragging] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const [sliderPosition, setSliderPosition] = useState(100);
    const [isSliderDragging, setIsSliderDragging] = useState(false);
    const [showTransition, setShowTransition] = useState(false);
    const sliderRef = useRef<HTMLDivElement | null>(null);
    const sourceImageInputRef = useRef<HTMLInputElement | null>(null);
    const sourceImageFileRef = useRef<File | null>(null);
    const maskImageInputRef = useRef<HTMLInputElement | null>(null);
    const maskImageFileRef = useRef<File | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const maskDropZoneRef = useRef<HTMLDivElement | null>(null);
    const { checkAccess, isCheckingGeo, isRestricted } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });
    
    // 使用 Hook 获取所需积分
    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('image-eraser');

    const handleUploadClick = () => {
        sourceImageInputRef.current?.click();
    };

    const handleMaskUploadClick = () => {
        maskImageInputRef.current?.click();
    };

    const processFile = async (file: File, isMask: boolean = false) => {
        const url = URL.createObjectURL(file);
        if (isMask) {
            setMaskImageName(file.name);
            setMaskImagePreview(url);
            maskImageFileRef.current = file;
        } else {
            setSourceImageName(file.name);
            setSourceImagePreview(url);
            sourceImageFileRef.current = file;
            setGeneratedImageUrl(null);
        }
        setError(null);
    };

    const handleFileChange = async (fileList: FileList | null, isMask: boolean = false) => {
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

        await processFile(file, isMask);
    };

    const handleDragOver = (e: React.DragEvent, isMask: boolean = false) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMask) {
            if (!isMaskDragging) {
                setIsMaskDragging(true);
            }
        } else {
            if (!isDragging) {
                setIsDragging(true);
            }
        }
    };

    const handleDragEnter = (e: React.DragEvent, isMask: boolean = false) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMask) {
            setIsMaskDragging(true);
        } else {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent, isMask: boolean = false) => {
        e.preventDefault();
        e.stopPropagation();
        const ref = isMask ? maskDropZoneRef : dropZoneRef;
        if (!ref.current?.contains(e.relatedTarget as Node)) {
            if (isMask) {
                setIsMaskDragging(false);
            } else {
                setIsDragging(false);
            }
        }
    };

    const handleDrop = async (e: React.DragEvent, isMask: boolean = false) => {
        e.preventDefault();
        e.stopPropagation();
        if (isMask) {
            setIsMaskDragging(false);
        } else {
            setIsDragging(false);
        }

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

        await processFile(file, isMask);
    };

    const handleDelete = (isMask: boolean = false) => {
        if (isMask) {
            if (maskImagePreview) {
                URL.revokeObjectURL(maskImagePreview);
            }
            setMaskImagePreview(null);
            setMaskImageName('');
            maskImageFileRef.current = null;
            if (maskImageInputRef.current) {
                maskImageInputRef.current.value = '';
            }
        } else {
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

    const callImageEraserAPI = async (imageUrl: string, maskImageUrl: string | null, prompt: string, outputFormat: string) => {
        const payload: any = {
            mediaType: 'image',
            image: imageUrl,
            prompt: prompt.trim(),
            output_format: outputFormat,
        };

        if (maskImageUrl) {
            payload.mask_image = maskImageUrl;
        }

        const response = await fetch('/api/ai/image-eraser/generate', {
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
                    `/api/ai/status?taskId=${requestId}&scenario=image-eraser`
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

            // Step 2: Upload mask image if provided
            let maskImageUrl: string | null = null;
            if (maskImageFileRef.current) {
                maskImageUrl = await uploadFile(maskImageFileRef.current);
                console.log('Mask image uploaded:', maskImageUrl);
            }

            // Step 3: Call image-eraser API
            const result = await callImageEraserAPI(sourceImageUrl, maskImageUrl, prompt, outputFormat);
            console.log('Generation result:', result);

            // Step 4: Extract wavespeed data
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) {
                throw new Error(result.message || t('errors.apiResponseParseFailed'));
            }

            // Step 5: Check for direct image URL (synchronous result)
            const directImageUrl = extractImageUrl(wavespeedData);
            if (directImageUrl) {
                setGeneratedImageUrl(directImageUrl);
                // 默认显示擦除后的图片
                setSliderPosition(100);
                return;
            }

            // Step 6: Poll for async result
            const requestId = extractRequestId(wavespeedData);
            if (!requestId) {
                throw new Error(t('errors.taskIdNotFound'));
            }

            const finalImageUrl = await pollTaskStatus(requestId);
            setGeneratedImageUrl(finalImageUrl);
            // 默认显示擦除后的图片
            setSliderPosition(100);
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
            link.download = `erased-image-${Date.now()}.${outputFormat}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            setError(t('errors.downloadFailed'));
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

    // 添加全局鼠标和触摸事件监听
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
                                onDragOver={(e) => handleDragOver(e, false)}
                                onDragEnter={(e) => handleDragEnter(e, false)}
                                onDragLeave={(e) => handleDragLeave(e, false)}
                                onDrop={(e) => handleDrop(e, false)}
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
                                                handleDelete(false);
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
                                onChange={(e) => handleFileChange(e.target.files, false)}
                            />
                        </div>
                    </div>

                    {/* Step 2: Upload Mask Image (Optional) */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                2
                            </span>
                            {t('steps.maskImage.title')}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t('steps.maskImage.hint')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="mt-2">
                            <p className="text-muted-foreground mb-1 text-xs">
                                {t('steps.maskImage.hint')}
                            </p>
                            <p className="text-xs text-foreground/80 mb-2">
                                {maskImageName ? t('common.selected', { name: maskImageName }) : t('common.notSelected')}
                            </p>
                            <div
                                ref={maskDropZoneRef}
                                onDragOver={(e) => handleDragOver(e, true)}
                                onDragEnter={(e) => handleDragEnter(e, true)}
                                onDragLeave={(e) => handleDragLeave(e, true)}
                                onDrop={(e) => handleDrop(e, true)}
                                onClick={handleMaskUploadClick}
                                className={cn(
                                    "relative rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[140px] transition-all cursor-pointer",
                                    isMaskDragging
                                        ? "border-primary bg-primary/10 scale-[1.02]"
                                        : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50",
                                    maskImagePreview && "border-solid cursor-default"
                                )}
                            >
                                {maskImagePreview ? (
                                    <>
                                        <img
                                            src={maskImagePreview}
                                            alt={t('alt.maskPreview')}
                                            className="w-full h-full object-contain max-h-[250px]"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 hover:bg-red-600/90 z-10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-2 text-center p-4">
                                        {isMaskDragging ? (
                                            <>
                                                <FileImage className="h-12 w-12 text-primary animate-bounce" />
                                                <p className="text-sm font-medium text-primary">
                                                    {t('steps.maskImage.dropHere')}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <FileImage className="h-12 w-12 text-muted-foreground" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {t('steps.maskImage.dragDrop')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('steps.maskImage.hint')}
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            <input
                                ref={maskImageInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/jpg"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files, true)}
                            />
                        </div>
                    </div>

                    {/* Step 3: Enter Prompt (Optional) */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                3
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
                                placeholder={t('steps.prompt.placeholder')}
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                className="min-h-[100px] resize-none"
                            />
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                {t('steps.prompt.hint')}
                            </p>
                        </div>
                    </div>

                    {/* Step 4: Output Format */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                4
                            </span>
                            {t('steps.outputFormat.title')}
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">{t('steps.outputFormat.hint')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                        <div className="mt-2">
                            <Select value={outputFormat} onValueChange={setOutputFormat}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder={t('steps.outputFormat.placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="jpeg">JPEG</SelectItem>
                                    <SelectItem value="png">PNG</SelectItem>
                                    <SelectItem value="webp">WebP</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                {t('steps.outputFormat.hint')}
                            </p>
                        </div>
                    </div>

                    {/* Step 5: Generate */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">
                                5
                            </span>
                            {t('steps.generate.title')}
                        </div>
                        <Button
                            size="lg"
                            className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                            onClick={startGenerate}
                            disabled={isGenerating || !sourceImageFileRef.current || (!!user && (isEstimating || requiredCredits === null))}
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
                            // 生成图完成后显示滑动条对比视图
                            <div
                                ref={sliderRef}
                                className="relative flex-1 overflow-hidden rounded-xl flex-shrink-0 bg-black/20 min-h-[400px] cursor-col-resize select-none"
                                onMouseDown={handleSliderAreaClick}
                                onTouchStart={handleSliderTouchStart}
                            >
                                {/* 原图 - 底层 */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <img
                                        src={sourceImagePreview}
                                        alt={t('alt.source')}
                                        className="w-full h-auto max-h-[600px] object-contain"
                                    />
                                    {/* Original 标签浮层 - 显示在原图上 */}
                                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium text-white/90 z-20 pointer-events-none">
                                        {t('preview.original')}
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
                                        alt={t('alt.generated')}
                                        className="w-full h-auto max-h-[600px] object-contain"
                                    />
                                    {/* Erased 标签浮层 - 显示在生成图上 */}
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium text-white/90 z-20 pointer-events-none">
                                        {t('preview.erased')}
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
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-gray-400 shadow-xl flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto cursor-col-resize"
                                        onMouseDown={handleSliderMouseDown}
                                    >
                                        <div className="flex gap-0.5">
                                            <div className="w-0.5 h-3 bg-gray-500 rounded-full" />
                                            <div className="w-0.5 h-3 bg-gray-500 rounded-full" />
                                        </div>
                                    </div>
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
