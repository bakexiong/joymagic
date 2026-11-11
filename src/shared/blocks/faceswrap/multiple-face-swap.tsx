'use client';

import { useRef, useState } from 'react';
import { Play, Scissors, Sparkles, Wand2, AlertCircle, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';

export function MultipleFaceSwap({ className }: { className?: string }) {
    const t = useTranslations('landing.faceSwap');
    const t2 = useTranslations('landing.wavespeed');
    const [videoName, setVideoName] = useState('');
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [swappedVideoUrl, setSwappedVideoUrl] = useState<string | null>(null);
    const [isRendering, setIsRendering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedFacesCount, setExtractedFacesCount] = useState(0);
    const videoInputRef = useRef<HTMLInputElement | null>(null);
    const videoFileRef = useRef<File | null>(null);
    const { checkAccess } = useUserAccessCheck({
        errorTranslationKey: 'landing.wavespeed.errors',
    });

    const handleUploadClick = () => {
        videoInputRef.current?.click();
    };

    const getVideoDuration = (file: File): Promise<number> => {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            video.preload = 'metadata';

            video.onloadedmetadata = () => {
                window.URL.revokeObjectURL(video.src);
                resolve(video.duration);
            };

            video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                reject(new Error(t('errors.videoDurationReadFailed')));
            };

            video.src = URL.createObjectURL(file);
        });
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
        const url = URL.createObjectURL(file);

        try {
            const duration = await getVideoDuration(file);
            const maxDuration = 600;

            if (duration > maxDuration) {
                setError(t('errors.videoDurationExceeded', {
                    max: maxDuration / 60,
                    current: Math.ceil(duration / 60)
                }));
                URL.revokeObjectURL(url);
                return;
            }
        } catch (err) {
            console.error('Failed to get video duration:', err);
            setError(t('errors.videoDurationReadFailed'));
            URL.revokeObjectURL(url);
            return;
        }

        setVideoName(file.name);
        setVideoPreview(url);
        videoFileRef.current = file;
        setSwappedVideoUrl(null);
        setError(null);
    };

    const handleDelete = () => {
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }
        setVideoPreview(null);
        setVideoName('');
        videoFileRef.current = null;
        setSwappedVideoUrl(null);
        if (videoInputRef.current) {
            videoInputRef.current.value = '';
        }
        setError(null);
    };

    const uploadFile = async (file: File, isVideo: boolean): Promise<string> => {
        const formData = new FormData();
        formData.append('files', file);

        const endpoint = isVideo ? '/api/storage/upload-video' : '/api/storage/upload-image';
        const response = await fetch(endpoint, {
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

    const startRender = async () => {
        const accessResult = checkAccess();
        if (!accessResult.passed) {
            if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
                setError(accessResult.errorMessage);
            }
            return;
        }
        if (!videoFileRef.current) {
            setError(t('errors.videoRequired'));
            return;
        }

        setIsRendering(true);
        setError(null);
        setSwappedVideoUrl(null);

        try {
            const videoUrl = await uploadFile(videoFileRef.current, true);
            console.log('Video uploaded:', videoUrl);

            // TODO: Multiple face swap API call
            // Use a translated fallback until the real backend flow is ready.
            throw new Error(t('errors.processingFailed'));
        } catch (err: any) {
            console.error('Render failed:', err);
            setError(err.message || t('errors.processingFailed'));
        } finally {
            setIsRendering(false);
        }
    };

    return (
        <div className={cn('grid gap-8 lg:grid-cols-[1.05fr_1fr]', className)}>
            {/* 左侧步骤 */}
            <div className="relative">
                <div className="space-y-5">
                    {/* Step 1: Upload a Video */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm sm:p-5">
                        <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                                1
                            </span>
                            {t('steps.video.title')}
                        </div>
                        <div className="mt-3">
                            <Button
                                variant="secondary"
                                size="lg"
                                className={cn(
                                    "relative h-16 w-full justify-center gap-2 text-white hover:opacity-90 bg-primary/15 text-primary hover:bg-primary/20",
                                )}
                                onClick={handleUploadClick}
                            >
                                <Play className="h-5 w-5" />
                                {t('steps.video.cta')}
                            </Button>
                            <p className="text-muted-foreground mt-2 text-xs">
                                {t('steps.video.hint')}
                            </p>
                            <p className="text-xs text-foreground/80">
                                {videoName ? t('common.selected', { name: videoName }) : t('common.notSelected')}
                            </p>
                            <div className="mt-4 relative rounded-xl border border-white/10 bg-black/40 overflow-hidden flex items-center justify-center h-48">
                                {videoPreview ? (
                                    <>
                                        <video
                                            src={videoPreview}
                                            controls
                                            className="w-full h-full object-contain"
                                            muted
                                        />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 hover:bg-red-600/90"
                                            onClick={handleDelete}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : null}
                            </div>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/mp4,video/quicktime,video/webm,video/x-m4v"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files)}
                            />
                        </div>
                    </div>

                    {/* Step 2: Face handling */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm sm:p-5">
                        <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                                2
                            </span>
                            {t('steps.multiple.face.title')}
                        </div>
                        <div className="mt-3">
                            <Button
                                variant="secondary"
                                size="lg"
                                className="relative h-16 w-full justify-center gap-2 bg-blue-500/20 text-white hover:bg-blue-500/30"
                                onClick={() => {
                                    if (extractedFacesCount < 6) {
                                        setExtractedFacesCount(extractedFacesCount + 1);
                                    }
                                }}
                            >
                                <Scissors className="h-5 w-5" />
                                {t('steps.multiple.face.cta', { count: extractedFacesCount, max: 6 })}
                            </Button>
                        </div>
                    </div>

                    {/* Step 3: Render */}
                    <div className="relative rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm sm:p-5">
                        <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold">
                                3
                            </span>
                            {t('steps.render.title')}
                        </div>
                        <Button
                            size="lg"
                            className="mt-4 w-full  bg-gradient-to-r from-[#b08936] via-[#a15545] to-[#8a3b78] px-6 py-5 text-lg font-semibold text-slate-900 shadow-[0_6px_22px_-6px_rgba(0,0,0,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.45)] disabled:opacity-70"
                            onClick={startRender}
                            disabled={isRendering || !videoFileRef.current}
                        >
                            {isRendering ? (
                                <>
                                    <Wand2 className="mr-2 h-5 w-5 animate-spin" />
                                    {t('steps.render.rendering')}
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-5 w-5" />
                                    {t('steps.render.cta')}
                                </>
                            )}
                        </Button>
                        {error && (
                            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                                <AlertCircle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button
                            onClick={() => window.open('/pricing', '_blank')}
                            className="w-full mt-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg animate-pulse"
                            size="lg"
                        >
                            <span className="mr-2">💳</span>
                            {t2('buttons.click_to_pay')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* 右侧预览 */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-4 shadow-xl lg:p-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        {t('preview.title')}
                    </span>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-transparent">
                    {videoPreview ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80">
                                <video
                                    src={videoPreview}
                                    controls
                                    className="h-full w-full object-cover"
                                    autoPlay
                                    loop
                                    muted
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white/80">
                                    {t('preview.original')}
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/80">
                                {swappedVideoUrl ? (
                                    <video
                                        src={swappedVideoUrl}
                                        controls
                                        className="h-full w-full object-cover"
                                        autoPlay
                                        loop
                                        muted
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-black/50">
                                        {isRendering ? (
                                            <Wand2 className="h-8 w-8 animate-spin text-primary" />
                                        ) : (
                                            <span className="text-xs text-muted-foreground">
                                                {t('preview.swapped')}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white/80">
                                    {t('preview.swapped')}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex min-h-[150px] w-full flex-col items-center justify-center gap-2 text-center text-slate-200">
                            <Wand2 className="h-8 w-8 text-slate-400" />
                            <p className="text-sm font-medium text-slate-300">
                                {t('preview.placeholder')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
