'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Wand2, AlertCircle, Trash2, FileImage, Download, Info, Package, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import { Slider } from '@/shared/components/ui/slider';
import { useAppContext } from '@/shared/contexts/app';
import {
    Dialog,
    DialogContent,
} from '@/shared/components/ui/dialog';
import { createOptimizedPreviewUrl, revokeObjectUrl } from '@/shared/lib/image-preview';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
import { Input } from '@/shared/components/ui/input';
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

const extractLayerUrls = (data: any): string[] => {
    if (!data) return [];

    // Try to extract all layers from outputs array
    if (Array.isArray(data.outputs)) {
        return data.outputs.filter((url: any) => typeof url === 'string');
    }

    // Fallback: try single output
    const singleUrl = extractImageUrl(data);
    return singleUrl ? [singleUrl] : [];
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

export function QwenImageLayered({ className }: { className?: string }) {
    const { user } = useAppContext();
    const t = useTranslations('landing.qwen-image-layered.qwenImageLayered');
    const t2 = useTranslations('landing.wavespeed');
    const [sourceImageName, setSourceImageName] = useState('');
    const [sourceImagePreview, setSourceImagePreview] = useState<string | null>(null);
    const [numLayers, setNumLayers] = useState(8);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [generatedLayers, setGeneratedLayers] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
    const layersScrollRef = useRef<HTMLDivElement | null>(null);
    const sourceImageInputRef = useRef<HTMLInputElement | null>(null);
    const sourceImageFileRef = useRef<File | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const { checkAccess, isCheckingGeo, isRestricted } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });

    // 使用 Hook 获取所需积分（动态：基于 numLayers，num_layers 必须 >= 2）
    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('qwen-image-layered', {
        num_layers: Math.max(2, numLayers),
    }, { debounceMs: 300 });

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
        setGeneratedLayers([]);
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
        setGeneratedLayers([]);
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

    const callLayeredAPI = async (imageUrl: string, numLayers: number) => {
        const response = await fetch('/api/ai/qwen-image-layered/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enable_base64_output: false,
                mediaType: 'image',
                image: imageUrl,
                num_layers: Math.max(2, numLayers),
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

    const pollTaskStatus = async (requestId: string): Promise<string[]> => {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));

            try {
                const statusResponse = await fetch(
                    `/api/ai/status?taskId=${requestId}&scenario=qwen-image-layered`
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
                    const layerUrls = statusData.outputs || [];
                    if (layerUrls.length > 0) {
                        console.log('[Polling] Got result layers:', layerUrls);
                        return layerUrls;
                    }
                    console.warn('[Polling] No valid layer URLs found in response:', statusData);
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
            setError(t('errors.imageRequired'));
            return;
        }

        // Step 1: Upload source image
        const finalImageUrl = await uploadFile(sourceImageFileRef.current);
        console.log('Source image uploaded:', finalImageUrl);

        // Reset state
        setIsGenerating(true);
        setError(null);
        setGeneratedImageUrl(null);
        setGeneratedLayers([]);

        try {
            // Step 2: Call layered API
            const result = await callLayeredAPI(finalImageUrl, numLayers);
            console.log('Generation result:', result);

            // Step 3: Extract wavespeed data
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) {
                throw new Error(result.message || t('errors.apiResponseParseFailed'));
            }

            // Step 4: Check for direct layers (synchronous result)
            const directLayers = extractLayerUrls(wavespeedData);
            if (directLayers.length > 0) {
                setGeneratedLayers(directLayers);
                setGeneratedImageUrl(directLayers[0]); // Keep for backward compatibility
                return;
            }

            // Step 5: Poll for async result
            const requestId = extractRequestId(wavespeedData);
            if (!requestId) {
                throw new Error(t('errors.taskIdNotFound'));
            }

            const finalLayers = await pollTaskStatus(requestId);
            setGeneratedLayers(finalLayers);
            setGeneratedImageUrl(finalLayers[0]); // Keep for backward compatibility
        } catch (err: any) {
            console.error('Generation failed:', err);
            setError(err.message || t('errors.processingFailed'));
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async (imageUrl: string, index?: number) => {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const filename = index !== undefined
                ? `layer-${index + 1}-${Date.now()}.png`
                : `layered-image-${Date.now()}.jpg`;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Download failed:', err);
            setError('Failed to download image');
        }
    };

    const handleDownloadAll = async () => {
        if (generatedLayers.length === 0) return;

        try {
            setError(null);

            // Dynamic import JSZip for zip download
            const JSZipModule = await import('jszip').catch(() => null);
            if (!JSZipModule) {
                throw new Error('JSZip library is required for downloading all layers. Please install jszip package.');
            }
            const JSZip = JSZipModule.default;

            // Fetch all images
            const blobs = await Promise.all(
                generatedLayers.map(async (url, index) => {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error(`Failed to fetch layer ${index + 1}`);
                    const blob = await response.blob();
                    return { blob, index, filename: `layer-${index + 1}.png` };
                })
            );

            // Create a zip file using JSZip
            const zip = new JSZip();

            // Add all images to zip
            blobs.forEach(({ blob, filename }) => {
                zip.file(filename, blob);
            });

            // Generate zip file
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const zipUrl = window.URL.createObjectURL(zipBlob);
            const link = document.createElement('a');
            link.href = zipUrl;
            link.download = `layers-${Date.now()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(zipUrl);
        } catch (err: any) {
            console.error('Download all failed:', err);
            setError(err.message || 'Failed to download layers as zip file');
        }
    };

    useEffect(() => {
        return () => {
            revokeObjectUrl(sourceImagePreview);
        };
    }, [sourceImagePreview]);


    return (
        <div className={cn('grid gap-6 lg:grid-cols-[1.05fr_1fr] items-stretch', className)}>
            {/* 左侧步骤 */}
            <div className="relative flex flex-col min-h-0">
                <div className="space-y-3 flex-1 overflow-y-auto min-h-0">
                    {/* Step 1: Upload Source Image */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                            <Info className="h-4 w-4" />
                            {t('steps.image.title')}
                        </div>
                        <div className="mt-2">
                            <p className="text-muted-foreground mb-1 text-xs">
                                {t('steps.image.hint')}
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
                                            alt="Source preview"
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
                                                    {t('steps.image.dropHere')}
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <FileImage className="h-12 w-12 text-muted-foreground" />
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-medium text-foreground">
                                                        {t('steps.image.dragDrop')}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {t('steps.image.hint')}
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

                    {/* Step 2: Num Layers */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-2">
                            <Info className="h-4 w-4" />
                            {t('steps.numLayers.title')}
                        </div>
                        <div className="mt-2">
                            <div className="flex items-center gap-4">
                                <Slider
                                    value={[numLayers]}
                                    onValueChange={(value) => setNumLayers(Math.max(2, value[0]))}
                                    min={2}
                                    max={8}
                                    step={1}
                                    className="flex-1"
                                />
                                <Input
                                    type="number"
                                    min={2}
                                    max={8}
                                    value={numLayers}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value) || 2;
                                        setNumLayers(Math.max(2, Math.min(8, value)));
                                    }}
                                    className="w-20"
                                />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs">
                                {t('steps.numLayers.hint')}
                            </p>
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
                            className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70"
                            onClick={startGenerate}
                            disabled={isGenerating || !sourceImageFileRef.current || (!!user && (isEstimating || requiredCredits === null))}
                        >
                            {isGenerating ? (
                                <>
                                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('steps.generate.generating')}
                                </>
                            ) : isEstimating ? (
                                <>
                                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                    <span>{t2('status.estimating', { defaultValue: 'Estimating...' })}</span>
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
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl lg:p-4 flex flex-col min-h-0 w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2 flex-shrink-0">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t('preview.title')}
                    </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-transparent flex-1 min-h-0 flex flex-col gap-4 w-full max-w-full">
                    {sourceImagePreview ? (
                        <>
                            {/* 上方：原图 */}
                            <div className="relative flex-shrink-0 rounded-xl bg-black/20 overflow-hidden">
                                <div className="relative aspect-video flex items-center justify-center">
                                    <img
                                        src={sourceImagePreview}
                                        alt="Source"
                                        className="w-full h-full object-contain max-h-[300px]"
                                    />
                                    <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 backdrop-blur-sm text-xs font-medium text-white/90">
                                        {t('preview.original')}
                                    </div>
                                    {isGenerating && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                            <div className="flex flex-col items-center gap-2">
                                                <Wand2 className="h-8 w-8 animate-spin text-primary" />
                                                <span className="text-xs text-white/90">{t('steps.generate.generating')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 下方：Layers 滑动展示 */}
                            {generatedLayers.length > 0 ? (
                                <div className="flex-1 min-h-0 flex flex-col">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground">
                                            {t('preview.layers')} ({generatedLayers.length})
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={handleDownloadAll}
                                        >
                                            <Package className="h-3 w-3 mr-1" />
                                            {t('preview.downloadAll') || 'Download All'}
                                        </Button>
                                    </div>
                                    <div
                                        ref={layersScrollRef}
                                        className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide w-full"
                                        style={{ scrollBehavior: 'smooth' }}
                                    >
                                        <div className="flex gap-4 h-full pb-2 w-max">
                                            {generatedLayers.map((layerUrl, index) => (
                                                <div
                                                    key={index}
                                                    className="relative flex-shrink-0 rounded-lg overflow-hidden border border-white/10 bg-black/20 cursor-pointer group"
                                                    style={{ width: '200px', height: '200px', maxWidth: '200px' }}
                                                    onClick={() => setEnlargedImage(layerUrl)}
                                                >
                                                    <img
                                                        src={layerUrl}
                                                        alt={`Layer ${index + 1}`}
                                                        className="w-full h-full object-contain"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="absolute bottom-2 left-2 right-2">
                                                            <div className="text-xs font-medium text-white mb-1">
                                                                Layer {index + 1}
                                                            </div>
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="w-full h-7 text-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDownload(layerUrl, index);
                                                                }}
                                                            >
                                                                <Download className="h-3 w-3 mr-1" />
                                                                Download
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center rounded-xl bg-black/20">
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground">
                                            {isGenerating ? t('steps.generate.generating') : t('preview.noLayers')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
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
                                alt="Enlarged preview"
                                className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                            />
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
