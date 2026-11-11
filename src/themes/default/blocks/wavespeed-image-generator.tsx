'use client';

import { motion } from 'framer-motion';
import {
  AlertCircle,
  ChevronDown,
  Coins,
  Info,
  Loader2,
  RotateCw,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
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
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog';
// import { ShareDialog } from '@/shared/components/share-dialog'; // DISABLED: share logic
import { PaymentButton } from '@/shared/components/payment-button';
import { SignModal } from '@/shared/blocks/sign/sign-modal';
import { PromptEnhanceButton } from '@/shared/components/prompt-enhance-button';
import { downloadFileFromUrl, ImagePreview } from '@/shared/lib/image-preview';
import { resolveApiErrorMessage } from '@/shared/lib/api-error';
import { useAppContext } from '@/shared/contexts/app';
import { cn } from '@/shared/lib/utils';
import { promptCategories } from '@/data/image-prompts';
import { useUserAccessCheck } from '@/shared/hooks/use-user-access-check';
import { useEstimateCredits } from '@/shared/hooks/use-estimate-credits';
import { Link } from '@/core/i18n/navigation';
import type { Button as ButtonConfig } from '@/shared/types/blocks/common';


export function WavespeedImageGenerator({
  className,
  ctaButtons,
  onGenerationComplete,
}: {
  className?: string;
  ctaButtons?: ButtonConfig[];
  onGenerationComplete?: (result: {
    url: string;
    type: 'image' | 'video';
    prompt: string;
    parameters: Record<string, any>;
  }) => void;
}) {
  const { user, setIsShowSignModal, fetchUserInfo } = useAppContext();
  const t = useTranslations('landing.wavespeed');
  const tCommonApi = useTranslations('common.api');
  const locale = useLocale();
  const isChineseLocale = locale?.startsWith('zh');
  const unknownErrorText = t('status.unknown_error');
  const { checkAccess, isRestricted, isCheckingGeo } = useUserAccessCheck({
    errorTranslationKey: 'landing.wavespeed.errors',
  });
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  // DISABLED: share logic
  // const [hasShared, setHasShared] = useState(false);
  // const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeCategory, setActiveCategory] = useState(promptCategories[0].id);
  const [isMounted, setIsMounted] = useState(false);
  // Mobile collapse state for Prompt Inspirations
  const [isInspirationExpanded, setIsInspirationExpanded] = useState(true);

  // Aspect ratio state
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '3:2' | '2:3' | '3:4' | '4:3' | '9:16'>('1:1');

  // Seed and output format state
  const [seed, setSeed] = useState<number>(-1);
  const [outputFormat, setOutputFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');

  // Video generation states
  const [videoUrl, setVideoUrl] = useState('');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videoStatus, setVideoStatus] = useState('');

  // Payment dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentDialogType, setPaymentDialogType] = useState<'image' | 'video'>('image');

  // 使用 Hook 获取所需积分
  const { credits: requiredImageCredits, isLoading: isEstimating, error: estimateError } = useEstimateCredits('z-image-turbo-text-to-image');

  // Check localStorage for share status on mount
  useEffect(() => {
    setIsMounted(true);

    // DISABLED: share logic
    // Check share status
    // if (typeof window !== 'undefined') {
    //   const shared = localStorage.getItem('z-image-shared');
    //   setHasShared(shared === 'true');
    // }

    // Default collapse Prompt Inspirations on mobile
    if (typeof window !== 'undefined') {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        setIsInspirationExpanded(false);
      }

      // 从 sessionStorage 读取初始提示词
      const initialPrompt = sessionStorage.getItem('creator-initial-prompt');
      if (initialPrompt) {
        setPrompt(initialPrompt);
        sessionStorage.removeItem('creator-initial-prompt');
      }
      // 从 sessionStorage 读取初始参数
      const initialParams = sessionStorage.getItem('creator-initial-params');
      if (initialParams) {
        try {
          const params = JSON.parse(initialParams);
          if (params.aspectRatio) setAspectRatio(params.aspectRatio);
          if (params.seed !== undefined) setSeed(params.seed);
          if (params.outputFormat) setOutputFormat(params.outputFormat);
        } catch {
          // 忽略解析错误
        }
        sessionStorage.removeItem('creator-initial-params');
      }
    }
  }, []);

  // DISABLED: share logic
  // Handle share completion
  // const handleShareComplete = () => {
  //   if (typeof window !== 'undefined') {
  //     localStorage.setItem('z-image-shared', 'true');
  //   }
  //   setHasShared(true);
  // };

  // Convert aspect ratio to size string (width*height)
  // Maximum width and height: 1536
  const getSizeFromAspectRatio = (ratio: string): string => {
    const sizeMap: Record<string, string> = {
      '1:1': '1024*1024',
      '16:9': '1536*864',   // width=1536, height=1536*9/16=864
      '3:2': '1536*1024',   // width=1536, height=1536*2/3=1024
      '2:3': '1024*1536',   // height=1536, width=1536*2/3=1024
      '3:4': '1152*1536',   // height=1536, width=1536*3/4=1152
      '4:3': '1536*1152',   // width=1536, height=1536*3/4=1152
      '9:16': '864*1536',   // height=1536, width=1536*9/16=864
    };
    return sizeMap[ratio] || '1024*1024';
  };

  const generateImage = async () => {
    // Check user access (login and restricted country)
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
        setError(accessResult.errorMessage);
      }
      return;
    }

    if (!prompt.trim()) {
      setError(t('errors.prompt_required'));
      return;
    }

    // Quick client-side check before hitting the eligibility endpoint
    const remainingCredits = user?.credits?.remainingCredits ?? 0;
    const freeImageGenerations = user?.freeImageGenerations ?? 0;
    if (requiredImageCredits !== null && freeImageGenerations <= 0 && remainingCredits < requiredImageCredits) {
      console.log('[Wavespeed] Insufficient credits/free quota locally, showing payment dialog');
      setPaymentDialogType('image');
      setShowPaymentDialog(true);
      return;
    }

    // Enter loading state immediately to prevent double submissions
    setIsGenerating(true);
    setError('');
    setStatus('');
    setImageUrl('');

    // Reset video states when generating new image
    setVideoUrl('');
    setVideoError('');
    setVideoStatus('');

    setStatus(t('status.submitting'));

    try {
      // Call our API to generate image
      console.log('[Wavespeed] Calling generate-image API...');
      const size = getSizeFromAspectRatio(aspectRatio);
      const generateResponse = await fetch('/api/ai/z-image-turbo-text-to-image/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mediaType: 'image', prompt, size, seed, output_format: outputFormat, enable_base64_output: false }),
      });

      console.log('[Wavespeed] Response status:', generateResponse.status);

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('[Wavespeed] Response not OK:', errorText);
        throw new Error(`Failed to generate image: ${generateResponse.status}`);
      }

      const generateResult = await generateResponse.json();
      console.log('[Wavespeed] Generate result:', generateResult);

      if (generateResult.code !== 0) {
        // If user is not authenticated, show sign in modal
        if (generateResult.message?.includes('no auth') || generateResult.message?.includes('sign in')) {
          setIsShowSignModal(true);
          setIsGenerating(false);
          return;
        }

        // Check if insufficient credits
        const { success, hasEnoughCredits } = generateResult.data || {};
        const localCredits = user?.credits?.remainingCredits ?? 0;

        if (
          (success === false || hasEnoughCredits === false) &&
          requiredImageCredits !== null && localCredits < requiredImageCredits
        ) {
          console.log('[Wavespeed] Insufficient credits, showing payment dialog');
          setPaymentDialogType('image');
          setShowPaymentDialog(true);
          setIsGenerating(false);
          return;
        }

        throw new Error(generateResult.message || 'Failed to generate image');
      }

      const { requestId } = generateResult.data || {};
      if (!requestId) {
        throw new Error('Failed to get request ID');
      }

      setStatus(t('status.task_submitted', { id: requestId }));

      // Poll for results using our API
      let attempts = 0;
      const maxAttempts = 60; // 60 seconds timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        const resultResponse = await fetch(`/api/ai/status?taskId=${requestId}&scenario=generate-image`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error('[Wavespeed] Get result error:', errorText);
          setError(t('errors.http_error', { code: resultResponse.status }));
          setIsGenerating(false);
          return;
        }

        const resultData = await resultResponse.json();

        if (resultData.code !== 0) {
          setError(resolveApiErrorMessage({
            payload: resultData,
            fallback: resultData.message || t('errors.request_failed', { error: unknownErrorText }),
            translate: (translationKey) => tCommonApi(translationKey as any),
          }));
          setIsGenerating(false);
          return;
        }

        const { status: taskStatus, output, outputs, error: taskError } = resultData.data || {};
        const resultUrl = output || (outputs && outputs[0]);

        if (taskStatus === "completed") {
          if (!resultUrl) {
            setError(t('errors.task_failed', { error: 'Result URL not found' }));
            setIsGenerating(false);
            return;
          }
          setImageUrl(resultUrl);
          setStatus(t('status.image_success'));
          setIsGenerating(false);
          // Refresh user info after successful generation to update credits/free generations
          await fetchUserInfo();

          // Notify parent component if callback provided
          if (onGenerationComplete) {
            onGenerationComplete({
              url: resultUrl,
              type: 'image',
              prompt: prompt,
              parameters: {
                aspectRatio,
                seed,
                outputFormat,
                size: getSizeFromAspectRatio(aspectRatio),
              },
            });
          }

          return;
        } else if (taskStatus === "failed") {
          setError(t('errors.task_failed', { error: taskError || unknownErrorText }));
          setIsGenerating(false);
          return;
        } else {
          setStatus(t('status.processing', { status: taskStatus }));
        }

        attempts++;
      }

      setError(t('errors.request_timeout'));
      setIsGenerating(false);
    } catch (err) {
      console.error('[Wavespeed] Error generating image:', err);
      setError(
        t('errors.request_failed', {
          error: err instanceof Error ? err.message : unknownErrorText,
        })
      );
      setIsGenerating(false);
    }
  };

  const generateVideo = async () => {
    // Check user access (login and restricted country)
    const accessResult = checkAccess();
    if (!accessResult.passed) {
      if (accessResult.reason === 'restricted' && accessResult.errorMessage) {
        setVideoError(accessResult.errorMessage);
      }
      return;
    }

    // Check if user has enough credits (>= 250)
    const remainingCredits = user?.credits?.remainingCredits ?? 0;
    if (remainingCredits < 250) {
      setVideoError(t('video.errors.insufficient_credits'));
      return;
    }

    if (!imageUrl) {
      setVideoError(t('video.errors.image_required'));
      return;
    }

    setIsGeneratingVideo(true);
    setVideoError('');
    setVideoUrl('');
    setVideoStatus(t('status.video_submitting'));

    try {
      // Call our API to generate video
      console.log('[Video Generation] Calling generate-video API...');
      const generateResponse = await fetch('/api/ai/generate-video/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaType: 'video',
          prompt: prompt.trim(), image: imageUrl.trim(), "duration": 5,
          "enable_prompt_expansion": false,
          "resolution": "720p",
          "seed": -1
        }),
      });

      console.log('[Video Generation] Response status:', generateResponse.status);

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error('[Video Generation] Response not OK:', errorText);
        throw new Error(`Failed to generate video: ${generateResponse.status}`);
      }

      const generateResult = await generateResponse.json();
      console.log('[Video Generation] Generate result:', generateResult);

      if (generateResult.code !== 0) {
        // If user is not authenticated, show sign in modal
        if (generateResult.message?.includes('no auth') || generateResult.message?.includes('sign in')) {
          setIsShowSignModal(true);
          setIsGeneratingVideo(false);
          return;
        }

        // Check if insufficient credits
        const { success, hasEnoughCredits } = generateResult.data || {};
        if (success === false || hasEnoughCredits === false) {
          setVideoError(t('video.errors.insufficient_credits'));
          setIsGeneratingVideo(false);
          // Refresh user info to update credits
          await fetchUserInfo();
          return;
        }

        throw new Error(generateResult.message || 'Failed to generate video');
      }

      const { requestId } = generateResult.data || {};
      if (!requestId) {
        throw new Error('Failed to get request ID');
      }

      setVideoStatus(t('status.video_task_submitted', { id: requestId }));

      // Refresh user info after credits are consumed
      await fetchUserInfo();

      // Poll for results using our API
      let attempts = 0;
      const maxAttempts = 240; // 2 minutes timeout

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds interval

        const resultResponse = await fetch(`/api/ai/status?taskId=${requestId}&scenario=generate-video`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!resultResponse.ok) {
          const errorText = await resultResponse.text();
          console.error('[Video Generation] Get result error:', errorText);
          setVideoError(t('errors.http_error', { code: resultResponse.status }));
          setIsGeneratingVideo(false);
          return;
        }

        const resultData = await resultResponse.json();

        if (resultData.code !== 0) {
          setVideoError(resolveApiErrorMessage({
            payload: resultData,
            fallback: resultData.message || t('errors.request_failed', { error: unknownErrorText }),
            translate: (translationKey) => tCommonApi(translationKey as any),
          }));
          setIsGeneratingVideo(false);
          return;
        }

        const { status: taskStatus, output, outputs, error: taskError } = resultData.data || {};
        const resultUrl = output || (outputs && outputs[0]);

        if (taskStatus === "completed") {
          if (!resultUrl) {
            setVideoError(t('video.errors.task_failed', { error: 'Result URL not found' }));
            setIsGeneratingVideo(false);
            return;
          }
          setVideoUrl(resultUrl);
          setVideoStatus(t('status.video_success'));
          setIsGeneratingVideo(false);
          // Credits were already consumed when generation started

          // Notify parent component if callback provided
          if (onGenerationComplete) {
            onGenerationComplete({
              url: resultUrl,
              type: 'video',
              prompt: prompt,
              parameters: {
                imageUrl,
                duration: 5,
                enable_prompt_expansion: false,
                resolution: '720p',
                seed: -1,
              },
            });
          }

          return;
        } else if (taskStatus === "failed") {
          setVideoError(t('video.errors.task_failed', { error: taskError || unknownErrorText }));
          setIsGeneratingVideo(false);
          return;
        } else {
          setVideoStatus(t('status.video_processing', { status: taskStatus }));
        }

        attempts++;
      }

      setVideoError(t('video.errors.timeout'));
      setIsGeneratingVideo(false);
    } catch (err) {
      console.error('[Video Generation] Error generating video:', err);
      setVideoError(
        t('errors.request_failed', {
          error: err instanceof Error ? err.message : unknownErrorText,
        })
      );
      setIsGeneratingVideo(false);
    }
  };

  return (
    <motion.section
      className={cn("relative pt-0 pb-16", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 1.3,
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1] as const,
      }}
    >
      <div className="mx-auto w-full max-w-[92rem] px-0">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          {/* Left Column - Input */}
          <div className="space-y-4">
            <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(11,14,24,0.98)_18%,rgba(11,14,24,1)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.24)] md:p-6">
              <label htmlFor="prompt" className="mb-2 block text-sm font-semibold text-white/90">
                {t('prompt_label')}
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('prompt_placeholder')}
                className="min-h-[200px] resize-none rounded-xl border border-transparent bg-white/[0.02] text-sm text-white/92 placeholder:text-white/42 shadow-none transition-all duration-300 hover:bg-white/[0.04] focus:border-transparent focus:bg-white/[0.04]"
                disabled={isGenerating}
              />
              <div className="mt-2 flex justify-end">
                <PromptEnhanceButton
                  prompt={prompt}
                  onEnhanced={setPrompt}
                  disabled={isGenerating}
                />
              </div>

              {/* Aspect Ratio Selector */}
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-white/90">
                  Aspect Ratio
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['1:1', '16:9', '3:2', '2:3', '3:4', '4:3', '9:16'] as const).map((ratio) => {
                    const [width, height] = ratio.split(':').map(Number);
                    const isSelected = aspectRatio === ratio;
                    const isHorizontal = width > height;
                    const isVertical = height > width;

                    // Calculate icon dimensions for visual representation
                    let iconWidth = 20;
                    let iconHeight = 20;
                    if (isHorizontal) {
                      iconWidth = 28;
                      iconHeight = 16;
                    } else if (isVertical) {
                      iconWidth = 16;
                      iconHeight = 28;
                    }

                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => setAspectRatio(ratio)}
                        disabled={isGenerating}
                        className={cn(
                          'flex flex-col items-center justify-center gap-1 rounded-xl border px-3 py-2 transition-all',
                          isSelected
                            ? 'border-transparent bg-white/[0.06] text-white shadow-none'
                            : 'border-transparent bg-white/[0.02] text-white/60 hover:bg-white/[0.04] hover:text-white/82',
                          isGenerating && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <div
                          className={cn(
                            'border-2 rounded-sm',
                            isSelected ? 'border-white/75 bg-white/18' : 'border-white/45 bg-transparent'
                          )}
                          style={{
                            width: `${iconWidth}px`,
                            height: `${iconHeight}px`,
                          }}
                        />
                        <span className="text-xs font-medium">{ratio}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seed and Output Format Settings */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Seed Input */}
                <div className="relative">
                  <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white/90">
                    seed
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 cursor-help text-white/45" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The random seed to use for the generation. -1 means a random seed will be used.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => {
                        const value = parseInt(e.target.value, 10);
                        if (!isNaN(value)) {
                          setSeed(value);
                        } else if (e.target.value === '' || e.target.value === '-') {
                          setSeed(-1);
                        }
                      }}
                      className="h-11 flex-1 rounded-xl border border-transparent bg-white/[0.02] text-white/92 shadow-none transition-all duration-300 hover:bg-white/[0.04] focus:border-transparent focus:bg-white/[0.04]"
                      disabled={isGenerating}
                      min={-1}
                    />
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => setSeed((prev) => (prev === -1 ? 0 : prev + 1))}
                        disabled={isGenerating}
                        className="flex h-5 w-7 items-center justify-center rounded-t-md border border-white/12 bg-white/[0.02] text-xs text-white/72 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => setSeed((prev) => (prev <= -1 ? -1 : prev - 1))}
                        disabled={isGenerating}
                        className="flex h-5 w-7 items-center justify-center rounded-b-md border border-white/12 bg-white/[0.02] text-xs text-white/72 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ↓
                      </button>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        // Generate a random seed value between 0 and 2147483647 (max 32-bit integer)
                        const randomSeed = Math.floor(Math.random() * 2147483648);
                        setSeed(randomSeed);
                      }}
                      disabled={isGenerating}
                      className="h-11 w-11 rounded-xl border border-transparent bg-white/[0.02] text-white/82 shadow-none transition-all duration-300 hover:bg-white/[0.04]"
                      title="Generate random seed"
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Output Format Select */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-white/90">
                    output_format
                  </label>
                  <Select
                    value={outputFormat}
                    onValueChange={(value: 'jpeg' | 'png' | 'webp') => setOutputFormat(value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="h-11 w-full rounded-xl border border-transparent bg-white/[0.02] text-left text-sm text-white shadow-none transition-all duration-300 hover:bg-white/[0.04] focus-visible:ring-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-[rgba(214,235,253,0.19)] bg-[#17191d] text-white shadow-xl shadow-black/30 backdrop-blur-xl">
                      <SelectItem value="jpeg">jpeg</SelectItem>
                      <SelectItem value="png">png</SelectItem>
                      <SelectItem value="webp">webp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim() || isCheckingGeo || isRestricted || (!!user && (isEstimating || requiredImageCredits === null))}
                className="group relative w-full mt-4 overflow-hidden border border-amber-200/50 bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-slate-900 shadow-[0_0_26px_rgba(249,115,22,0.4)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(249,115,22,0.65)] focus-visible:ring-amber-200/60"
                size="lg"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen transition duration-700 group-hover:opacity-100"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 35%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.3), transparent 30%)',
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-[120%] bg-[conic-gradient(from_120deg,rgba(255,255,255,0.05),rgba(255,255,255,0.4),rgba(255,255,255,0.05))] animate-[spin_6s_linear_infinite] opacity-70 blur-3xl"
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isEstimating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('status.estimating', { defaultValue: 'Estimating...' })}
                    </>
                  ) : isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('buttons.generating')}
                    </>
                  ) : isCheckingGeo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('buttons.checking')}
                    </>
                  ) : isRestricted ? (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      {t('buttons.unavailable')}
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4" />
                      <span>
                        {t('buttons.generate')}
                        {!isGenerating && !isCheckingGeo && !isRestricted && !isEstimating && requiredImageCredits !== null && (
                          <span className="ml-1.5 opacity-90">
                            ({requiredImageCredits} {t('buttons.credits', { defaultValue: 'credits' })})
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </span>
              </Button>
              {estimateError && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-400">
                  <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="break-words">{t('errors.estimate_failed', { defaultValue: 'Failed to estimate credits' })}: {estimateError}</span>
                </div>
              )}

              {/* 闪动的付费按钮 - 只在免费用户或积分小于20时显示 */}
              <PaymentButton
                minCredits={20}
                buttonText={t('buttons.click_to_pay')}
              />

              {isMounted && isRestricted && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{t('errors.restricted')}</span>
                  </p>
                </div>
              )}

              {/* DISABLED: share logic
              {isMounted && !hasShared && !isRestricted && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {t('share_hint')}
                </p>
              )}
              */}

              {status && !error && (
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  {status}
                </p>
              )}

              {error && (
                <p className="text-sm text-destructive mt-3 text-center">
                  {error}
                </p>
              )}
            </div>

            {/* Prompt Categories + Guides */}
            <div className="hidden rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(11,14,24,0.92)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:block">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsInspirationExpanded(!isInspirationExpanded)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setIsInspirationExpanded(!isInspirationExpanded)
                  }
                }}
                className="mb-4 flex w-full flex-wrap items-center gap-2 md:cursor-default"
              >
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-semibold text-foreground">
                  {t('prompt_inspirations')}
                </h3>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 ml-1 transition-transform md:hidden',
                    isInspirationExpanded && 'rotate-180'
                  )}
                />
              </div>

              {isInspirationExpanded ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {promptCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        disabled={isGenerating}
                        className={cn(
                          'px-3 py-1.5 text-xs rounded-full transition-all',
                          activeCategory === category.id
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted',
                          isGenerating && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {isChineseLocale ? category.name : category.nameEn}
                      </button>
                    ))}
                  </div>

                  <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                    {promptCategories
                      .find((cat) => cat.id === activeCategory)
                      ?.prompts.map((examplePrompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPrompt(examplePrompt.text)}
                          disabled={isGenerating}
                          className="w-full flex items-center gap-3 text-left text-xs text-muted-foreground hover:text-foreground transition-colors p-3 rounded-lg hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed border border-border/50 hover:border-border"
                        >
                          {examplePrompt.thumbnail && (
                            <div className="flex-shrink-0 w-[250px] h-[250px] overflow-hidden rounded-md shadow-sm">
                              <img
                                src={examplePrompt.thumbnail}
                                alt={examplePrompt.text}
                                width={250}
                                height={250}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <span className="flex-1 line-clamp-6">
                            {examplePrompt.text}
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right Column - Output */}
          <div className="space-y-4">
            <div className="flex min-h-[540px] items-center justify-center rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(11,14,24,0.98)_18%,rgba(11,14,24,1)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_18px_40px_rgba(0,0,0,0.24)]">
              {imageUrl ? (
                <div className="w-full space-y-4">
                  <ImagePreview
                    src={imageUrl}
                    alt={t('image_area.alt')}
                    downloadTitle={t('download', { defaultValue: 'Download' })}
                    onDownload={() => downloadFileFromUrl(imageUrl)}
                    placeholder={null}
                    className="w-full"
                    containerClassName="w-full min-h-0 bg-transparent"
                    imageClassName="rounded-lg max-h-none"
                  />
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline block text-center"
                  >
                    {t('links.open_in_new_tab')}
                  </a>

                  {!videoUrl && !isGeneratingVideo && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                    >
                      {(() => {
                        const remainingCredits = user?.credits?.remainingCredits ?? 0;
                        const hasEnoughCredits = remainingCredits >= 250;
                        const isEnabled = hasEnoughCredits && !!imageUrl && !!user;
                        const showPaymentButton = !hasEnoughCredits && !!imageUrl;

                        const handleButtonClick = () => {
                          if (isEnabled) {
                            generateVideo();
                          } else if (showPaymentButton) {
                            setPaymentDialogType('video');
                            setShowPaymentDialog(true);
                          }
                        };

                        return (
                          <Button
                            onClick={handleButtonClick}
                            disabled={!isEnabled && !showPaymentButton}
                            size="lg"
                            className={cn(
                              "w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg transition-all duration-300 relative overflow-hidden",
                              isEnabled || showPaymentButton
                                ? "cursor-pointer hover:shadow-xl hover:scale-[1.02]"
                                : "cursor-not-allowed opacity-75"
                            )}
                          >
                            {isEnabled && (
                              <motion.div
                                className="absolute inset-0 bg-white/20"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 2,
                                  ease: 'linear',
                                }}
                              />
                            )}
                            <Sparkles className={cn("mr-2 h-5 w-5", isEnabled ? "animate-pulse" : "")} />
                            <span className="relative z-10">
                              {remainingCredits < 250
                                ? t('video.cta_pay')
                                : t('video.cta_ready')}
                            </span>
                          </Button>
                        );
                      })()}
                    </motion.div>
                  )}

                  {ctaButtons && ctaButtons.length > 0 && (
                    <div className="mt-4 flex justify-center">
                      {ctaButtons.slice(0, 1).map((button, idx) => (
                        <Button
                          asChild
                          key={`${button.title || 'cta'}-${idx}`}
                          size={button.size || 'default'}
                          variant={button.variant || 'default'}
                          className="w-full max-w-xs gap-2 px-5 text-sm shadow-md"
                        >
                          <Link
                            href={button.url ?? ''}
                            target={button.target ?? '_self'}
                            className="flex items-center justify-center gap-2"
                          >
                            {(button.icon_url || button.icon) && (
                              <span className="inline-flex h-5 w-5 items-center justify-center">
                                {button.icon_url ? (
                                  <img
                                    src={button.icon_url}
                                    alt={`${button.title || 'Button'} icon`}
                                    className="h-5 w-5 object-contain"
                                  />
                                ) : (
                                  <Sparkles className="h-5 w-5" />
                                )}
                              </span>
                            )}
                            <span>{button.title}</span>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ) : isGenerating ? (
                <div className="text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-white/58">
                    {t('image_area.loading')}
                  </p>
                </div>
              ) : (
                <div className="text-center text-white/58">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>{t('image_area.placeholder')}</p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <p className="inline-flex items-center px-3 py-1 text-xs font-semibold text-white/58">
                Powered by open-source diffusion models optimized by Barko Bear
              </p>
            </div>
            {/* Video Generation Status and Output */}
            {(isGeneratingVideo || videoUrl || videoError) && (
              <div className="rounded-[1.7rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03)_0%,rgba(11,14,24,0.92)_100%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white/90">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  {t('video.title')}
                </h3>

                {isGeneratingVideo ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-purple-500 mx-auto mb-4" />
                    <p className="mb-2 text-white/58">
                      {t('video.creating')}
                    </p>
                    {videoStatus && (
                      <p className="text-sm text-white/50">
                        {videoStatus}
                      </p>
                    )}
                  </div>
                ) : videoUrl ? (
                  <div className="space-y-4">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full rounded-lg"
                      autoPlay
                      loop
                    >
                      {t('video.unsupported')}
                    </video>
                    <a
                      href={videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline block text-center"
                    >
                      {t('video.download')}
                    </a>
                  </div>
                ) : videoError ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive">
                      {videoError}
                    </p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISABLED: share logic
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        onShareComplete={handleShareComplete}
      />
      */}

      {/* Sign In Modal */}
      <SignModal callbackUrl="/" />

      {/* Payment Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          setShowPaymentDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          {/*
            paymentDialogType:
            - 'image' => user used free quota or lacks credits for images
            - 'video' => user lacks credits for video generation
          */}
          <DialogHeader>
            <DialogTitle>{t(paymentDialogType === 'image' ? 'payment_image.title' : 'payment.title')}</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t(paymentDialogType === 'image' ? 'payment_image.line1' : 'payment.line1')}</p>
                <p>{t(paymentDialogType === 'image' ? 'payment_image.line2' : 'payment.line2')}</p>
                <p>{t(paymentDialogType === 'image' ? 'payment_image.line3' : 'payment.line3')}</p>
                {paymentDialogType === 'image' && (
                  <p>{t('payment_image.line4')}</p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogHeader>
            <DialogDescription className="text-sm text-muted-foreground">
              {paymentDialogType === 'image'
                ? t('payment_image.cta_note')
                : t('payment.cta_note')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild size="lg">
                <a href="/pricing">
                  {t(paymentDialogType === 'image' ? 'payment_image.buy_now' : 'payment.buy_now')}
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowPaymentDialog(false)}
              >
                {t(paymentDialogType === 'image' ? 'payment_image.wait_tomorrow' : 'payment.view_later')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
