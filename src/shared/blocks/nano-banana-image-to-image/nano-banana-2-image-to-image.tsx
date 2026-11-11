'use client';

import { useRef, useState, useEffect } from 'react';
import { Sparkles, Wand2, AlertCircle, Trash2, FileImage, Download, Plus, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { PaymentButton } from '@/shared/components/payment-button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { downloadFileFromUrl, ImagePreview } from '@/shared/lib/image-preview';
import { resolveApiErrorMessage } from '@/shared/lib/api-error';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
import { useAppContext } from '@/shared/contexts/app';
import { PromptEnhanceButton } from '@/shared/components/prompt-enhance-button';
import { isTaskCompleted, isTaskFailed, isTaskProcessing } from '@/shared/lib/task-status';

const POLL_INTERVAL = 2000;
const MAX_POLL_ATTEMPTS = 120;
const MAX_IMAGES = 14;

const ASPECT_RATIO_AUTO = 'auto';
const ASPECT_RATIOS = [ASPECT_RATIO_AUTO, '1:1', '3:2', '2:3', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
const RESOLUTIONS = ['1k', '2k', '4k'];

const extractWavespeedData = (result: any) => {
    if (result.code === 0 && result.data) {
        if (result.data.code === 200 && result.data.data) return result.data.data;
        if (result.data.requestId || result.data.id) return result.data;
    }
    return null;
};

const extractImageUrl = (data: any): string | null => {
    if (!data) return null;
    const url = data.outputs?.[0] || data.image_url || data.url || data.output_url || data.image;
    return typeof url === 'string' ? url : null;
};

const extractRequestId = (data: any): string | null => {
    if (!data) return null;
    return data.requestId || data.id || data.request_id || null;
};

interface ImageFile {
    file: File;
    preview: string;
    name: string;
}

export function NanoBanana2ImageToImage({ className }: { className?: string }) {
    const { user } = useAppContext();
    const t = useTranslations('landing.nano-banana-2-image-to-image');
    const tCommonApi = useTranslations('common.api');
    const t2 = useTranslations('landing.wavespeed');
    const [images, setImages] = useState<ImageFile[]>([]);
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIO_AUTO);
    const [resolution, setResolution] = useState('1k');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const { checkAccess } = useUserAccessCheck({ errorTranslationKey: 'landing.wavespeed.errors' });

    const { credits: requiredCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits(
        'nano-banana-2-image-to-image',
        {
            ...(aspectRatio && aspectRatio !== ASPECT_RATIO_AUTO ? { aspect_ratio: aspectRatio } : {}),
            resolution,
        },
    );

    const handleUploadClick = () => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }
        imageInputRef.current?.click();
    };

    const processFiles = async (files: FileList) => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) setError(accessResult.errorMessage);
            return;
        }
        const newImages: ImageFile[] = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            if (images.length + newImages.length >= MAX_IMAGES) break;
            newImages.push({ file, preview: URL.createObjectURL(file), name: file.name });
        }
        if (newImages.length > 0) {
            setImages([...images, ...newImages]);
            setGeneratedImageUrl(null);
            setError(null);
        }
    };

    const handleFileChange = async (fileList: FileList | null) => {
        if (!fileList || fileList.length === 0) return;
        await processFiles(fileList);
    };

    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!isDragging) setIsDragging(true); };
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) setIsDragging(false); };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) setError(accessResult.errorMessage);
            return;
        }
        if (e.dataTransfer.files?.length) await processFiles(e.dataTransfer.files);
    };

    const handleDeleteImage = (index: number) => {
        const img = images[index];
        if (img.preview) URL.revokeObjectURL(img.preview);
        const newImages = images.filter((_, i) => i !== index);
        setImages(newImages);
        if (newImages.length === 0) setGeneratedImageUrl(null);
        setError(null);
    };

    const uploadFiles = async (files: File[]): Promise<string[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const response = await fetch('/api/storage/upload-image', { method: 'POST', body: formData });
        if (!response.ok) throw new Error(t('errors.uploadFailed', { error: response.statusText }));
        const result = await response.json();
        if (result.code !== 0 || !result.data?.urls?.length) throw new Error(result.message || t('errors.uploadFailedGeneric'));
        return result.data.urls as string[];
    };

    const callImageToImageAPI = async (imageUrls: string[], prompt: string) => {
        const body: any = {
            mediaType: 'image',
            images: imageUrls,
            prompt: prompt.trim(),
            enable_base64_output: false,
            enable_sync_mode: false,
            seed: -1,
            resolution,
        };
        if (aspectRatio && aspectRatio !== ASPECT_RATIO_AUTO) body.aspect_ratio = aspectRatio;

        const response = await fetch('/api/ai/nano-banana-2-image-to-image/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(resolveApiErrorMessage({
                payload: errorData,
                fallback: errorData.message || t('errors.generationFailed'),
                translate: (translationKey) => tCommonApi(translationKey as any),
            }));
        }
        const result = await response.json();
        if (result.code !== 0) throw new Error(resolveApiErrorMessage({
            payload: result,
            fallback: result.message || t('errors.generationFailed'),
            translate: (translationKey) => tCommonApi(translationKey as any),
        }));
        if (result.data?.success === false) throw new Error(result.data.message || t('errors.generationFailed'));
        return result;
    };

    const pollTaskStatus = async (requestId: string): Promise<string> => {
        for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            try {
                const statusResponse = await fetch(`/api/ai/status?taskId=${requestId}&scenario=nano-banana-2-image-to-image`);
                if (!statusResponse.ok) continue;
                const statusResult = await statusResponse.json();
                if (statusResult.code !== 0) throw new Error(resolveApiErrorMessage({
                    payload: statusResult,
                    fallback: statusResult.message || t('errors.statusQueryFailed'),
                    translate: (translationKey) => tCommonApi(translationKey as any),
                }));
                const statusData = statusResult.data;
                if (!statusData) throw new Error(resolveApiErrorMessage({
                    payload: statusResult,
                    fallback: statusResult.message || t('errors.statusQueryFailed'),
                    translate: (translationKey) => tCommonApi(translationKey as any),
                }));
                const taskStatus = statusData.status;
                if (isTaskCompleted(taskStatus)) { const imageUrl = statusData.output; if (imageUrl) return imageUrl; }
                else if (isTaskFailed(taskStatus)) throw new Error(statusData.error || statusData.message || t('errors.taskFailed'));
                else if (isTaskProcessing(taskStatus)) continue;
            } catch (err: any) { if (err.message && !err.message.includes('fetch')) throw err; }
        }
        throw new Error(t('errors.taskTimeout'));
    };

    const startGenerate = async () => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) setError(accessResult.errorMessage);
            return;
        }
        if (images.length === 0) { setError(t('errors.sourceImageRequired')); return; }
        if (!prompt.trim()) { setError(t('errors.promptRequired')); return; }

        setIsGenerating(true); setError(null); setGeneratedImageUrl(null);
        try {
            const imageUrls = await uploadFiles(images.map(img => img.file));
            const result = await callImageToImageAPI(imageUrls, prompt);
            const wavespeedData = extractWavespeedData(result);
            if (!wavespeedData) throw new Error(result.message || t('errors.apiResponseParseFailed'));
            const directImageUrl = extractImageUrl(wavespeedData);
            if (directImageUrl) { setGeneratedImageUrl(directImageUrl); return; }
            const requestId = extractRequestId(wavespeedData);
            if (!requestId) throw new Error(t('errors.taskIdNotFound'));
            const finalImageUrl = await pollTaskStatus(requestId);
            setGeneratedImageUrl(finalImageUrl);
        } catch (err: any) {
            setError(err.message || t('errors.processingFailed'));
        } finally { setIsGenerating(false); }
    };

    const handleDownload = async (imageUrl: string) => {
        try {
            await downloadFileFromUrl(imageUrl, 'jpg');
        } catch { setError('Failed to download image'); }
    };

    useEffect(() => {
        return () => { images.forEach(img => { if (img.preview) URL.revokeObjectURL(img.preview); }); };
    }, []);

    return (
        <div className={cn('grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-[1.05fr_1fr] items-start lg:items-stretch w-full max-w-full overflow-x-hidden', className)}>
            <div className="relative flex flex-col w-full max-w-full lg:min-h-0">
                <div className="space-y-3 md:space-y-4 w-full max-w-full lg:flex-1 lg:overflow-y-auto lg:min-h-0">
                    {/* Step 1: Upload Source Images */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs">1</span>
                            {t('steps.sourceImage.title')}
                        </div>
                        <div className="mt-2">
                            <p className="text-muted-foreground mb-1 text-xs">{t('steps.sourceImage.hint', { max: MAX_IMAGES })}</p>
                            <p className="text-xs text-foreground/80 mb-2">
                                {images.length > 0 ? t('common.selectedCount', { count: images.length, max: MAX_IMAGES }) : t('common.notSelected')}
                            </p>
                            {images.length > 0 && (
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    {images.map((img, index) => (
                                        <div key={index} className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40">
                                            <img src={img.preview} alt={`Source ${index + 1}`} className="w-full h-32 object-cover" />
                                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-red-500/80 hover:bg-red-600/90 z-10" onClick={() => handleDeleteImage(index)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                            <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white/90">{index + 1}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {images.length < MAX_IMAGES && (
                                <div ref={dropZoneRef} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleUploadClick}
                                    className={cn("relative rounded-lg md:rounded-xl border-2 border-dashed overflow-hidden flex items-center justify-center min-h-[120px] md:min-h-[140px] transition-all cursor-pointer w-full max-w-full",
                                        isDragging ? "border-primary bg-primary/10 scale-[1.02]" : "border-white/10 bg-black/40 hover:border-primary/30 hover:bg-black/50")}>
                                    {isDragging ? (
                                        <><FileImage className="h-10 w-10 md:h-12 md:w-12 text-primary animate-bounce" /><p className="text-xs md:text-sm font-medium text-primary ml-2">{t('steps.sourceImage.dropHere')}</p></>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-2 text-center p-3 md:p-4">
                                            <Plus className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
                                            <div className="space-y-0.5">
                                                <p className="text-xs font-medium text-foreground">{t('steps.sourceImage.dragDrop')}</p>
                                                <p className="text-xs text-muted-foreground">{t('steps.sourceImage.hint', { max: MAX_IMAGES })}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/jpg" multiple className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
                        </div>
                    </div>

                    {/* Step 2: Aspect Ratio */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">2</span>
                            {t('steps.aspectRatio.title')}
                        </div>
                        <div className="mt-2">
                            <Select value={aspectRatio} onValueChange={setAspectRatio}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('steps.aspectRatio.placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {ASPECT_RATIOS.map((ratio) => (
                                        <SelectItem key={ratio} value={ratio}>{ratio === ASPECT_RATIO_AUTO ? t('steps.aspectRatio.auto') : ratio}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground mt-1.5 text-xs">{t('steps.aspectRatio.hint')}</p>
                        </div>
                    </div>

                    {/* Step 3: Resolution */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">3</span>
                            {t('steps.resolution.title')}
                        </div>
                        <div className="mt-2">
                            <Select value={resolution} onValueChange={setResolution}>
                                <SelectTrigger>
                                    <SelectValue placeholder={t('steps.resolution.placeholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {RESOLUTIONS.map((item) => (
                                        <SelectItem key={item} value={item}>{item.toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-muted-foreground mt-1.5 text-xs">{t('steps.resolution.hint')}</p>
                        </div>
                    </div>

                    {/* Step 4: Enter Prompt */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">4</span>
                            {t('steps.prompt.title')}
                        </div>
                        <div className="mt-2 w-full max-w-full">
                            <Textarea placeholder={t('steps.prompt.placeholder')} value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-[80px] md:min-h-[100px] resize-none text-sm w-full max-w-full" />
                            <div className="flex justify-end mt-1.5">
                                <PromptEnhanceButton prompt={prompt} onEnhanced={setPrompt} disabled={isGenerating} />
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs">{t('steps.prompt.hint')}</p>
                        </div>
                    </div>

                    {/* Step 5: Generate */}
                    <div className="relative rounded-xl md:rounded-2xl border border-white/10 bg-card/60 p-3 shadow-sm sm:p-4 w-full max-w-full">
                        <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-6 w-6 md:h-7 md:w-7 items-center justify-center rounded-full bg-primary text-white font-semibold text-xs flex-shrink-0">5</span>
                            {t('steps.generate.title')}
                        </div>
                        <Button size="lg" className="group relative mt-3 w-full overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60 disabled:opacity-70" onClick={startGenerate} disabled={isGenerating || images.length === 0 || !prompt.trim() || (!!user && (isEstimating || requiredCredits === null))}>
                            {isGenerating ? (
                                <><Wand2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" /><span className="text-xs md:text-sm">{t('steps.generate.generating')}</span></>
                            ) : isEstimating ? (
                                <><RefreshCw className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" /><span className="text-xs md:text-sm">{t2('status.estimating', { defaultValue: 'Estimating...' })}</span></>
                            ) : (
                                <><Sparkles className="mr-2 h-4 w-4 md:h-5 md:w-5" /><span className="text-xs md:text-sm">{t('steps.generate.cta')}{!isGenerating && !isEstimating && requiredCredits !== null && (<span className="ml-1.5 opacity-90">({requiredCredits} {t2('buttons.credits', { defaultValue: 'credits' })})</span>)}</span></>
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
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /><span className="break-words">{error}</span>
                            </div>
                        )}
                        <div className="mt-2"><PaymentButton minCredits={requiredCredits ?? 999} buttonText={t2('buttons.click_to_pay')} /></div>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-3 shadow-xl lg:p-4 flex flex-col w-full max-w-full lg:min-h-0">
                <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground mb-2 flex-shrink-0 w-full">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4 text-primary flex-shrink-0" />
                        {t('preview.title')}
                    </span>
                </div>
                <div className="relative overflow-hidden rounded-xl md:rounded-2xl bg-transparent lg:flex-1 min-h-0 flex flex-col w-full max-w-full">
                    <ImagePreview
                        src={generatedImageUrl}
                        alt="Generated"
                        dialogAlt="Enlarged preview"
                        downloadTitle="Download image"
                        onDownload={generatedImageUrl ? () => handleDownload(generatedImageUrl) : null}
                        placeholder={isGenerating ? (
                            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-[300px] md:min-h-[400px]">
                                <Wand2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
                                <span className="text-xs md:text-sm text-white/90">{t('steps.generate.generating')}</span>
                            </div>
                        ) : (
                            <div className="flex flex-1 w-full flex-col items-center justify-center gap-2 text-center text-slate-200 min-h-[300px] md:min-h-[400px]">
                                <Wand2 className="h-6 w-6 md:h-8 md:w-8 text-slate-400" />
                                <p className="text-xs md:text-sm font-medium text-slate-300 px-4">{t('preview.placeholder')}</p>
                            </div>
                        )}
                        className="relative overflow-hidden rounded-xl md:rounded-2xl bg-transparent lg:flex-1 min-h-0 flex flex-col w-full max-w-full"
                    />
                </div>
            </div>
        </div>
    );
}
