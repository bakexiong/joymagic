'use client';

import { Link } from '@/core/i18n/navigation';
import { Badge } from '@/shared/components/ui/badge';
import { getLobeIconUrl } from '@/shared/lib/model-vendor-logo';
import { isCreemReviewMode } from '@/shared/lib/creem-review';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table';

interface CreditsCostItem {
  url: string;
  model: string;
  option: string;
  unit: string;
  credits: number | string;
  category: 'image' | 'video' | 'ai';
  vendorLogo: string;
  vendorName: string;
}

type CreditCostType = 'fixed' | 'dynamic';

interface CreditCostConfig {
  type: CreditCostType;
  credits?: number;
  calculator?: string;
  params?: Record<string, unknown>;
  mediaType?: 'image' | 'video' | 'music' | 'text' | 'speech';
}

const REVIEW_BLOCKED_CREDIT_SCENARIOS = new Set<string>(['video-face-swap']);

// 单一配置源：后续只改这里即可自动生成表格
const CREDIT_COSTS_CONFIG: Record<string, CreditCostConfig> = {
  'z-image-turbo-text-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'image-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'image-background-remover': { type: 'fixed', credits: 2, mediaType: 'image' },
  'image-eraser': { type: 'fixed', credits: 10, mediaType: 'image' },
  'image-upscaler': { type: 'fixed', credits: 4, mediaType: 'image' },
  'seedream-v4-5-text-to-image': { type: 'fixed', credits: 16, mediaType: 'image' },
  'nano-banana-text-to-image': { type: 'fixed', credits: 16, mediaType: 'image' },
  'nano-banana-pro-text-to-image': { type: 'dynamic', credits: 56, mediaType: 'image' },
  'qwen-202512-text-to-image': { type: 'fixed', credits: 10, mediaType: 'image' },
  'gpt-image-1-text-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'gpt-image-1' },
  'gpt-image-2-text-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'gpt-image-1' },
  'qwen-image-layered': { type: 'dynamic', mediaType: 'image', calculator: 'per-layer' },
  'text-to-video-veo-3-1': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'image-to-video-veo-3-1': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'text-to-video-ltx-2-fast': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'text-to-video-ltx-2-pro': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'image-to-video-ltx-2-fast': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'image-to-video-ltx-2-pro': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'flux-2-klein-text-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'flux-2-klein-image-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'text-to-video-wan-2-6': { type: 'dynamic', mediaType: 'video', calculator: 'duration-block-resolved' },
  'text-to-video-seedance-1-5-pro': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'image-to-video-seedance-1-5-pro': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'video-face-swap': { type: 'dynamic', mediaType: 'video', calculator: 'duration-based' },
  'motion-control-kling-2-6': { type: 'dynamic', mediaType: 'video', calculator: 'tier-based' },
  'longcat-avatar': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'generate-video': { type: 'fixed', credits: 250, mediaType: 'video' },
  'text-to-video-pixverse-5-6': { type: 'dynamic', mediaType: 'video', calculator: 'param-combination-pricing' },
  'image-to-video-pixverse-5-6': { type: 'dynamic', mediaType: 'video', calculator: 'param-combination-pricing' },
  'image-to-video-vidu-q3': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'text-to-video-happyhorse-1-0': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'image-to-video-happyhorse-1-0': { type: 'dynamic', mediaType: 'video', calculator: 'seedance-duration' },
  'soul-image-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'param-combination-pricing' },
  'z-image-turbo-image-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'grok-imagine-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'seedream-5-0-lite-text-to-image': { type: 'fixed', credits: 16, mediaType: 'image' },
  'seedream-5-0-lite-image-to-image': { type: 'fixed', credits: 12, mediaType: 'image' },
  'qwen-image-max-image-to-image': { type: 'fixed', credits: 2, mediaType: 'image' },
  'gpt-image-2-image-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'gpt-image-1' },
  'nano-banana-image-to-image': { type: 'fixed', credits: 10, mediaType: 'image' },
  'nano-banana-pro-edit-ultra': { type: 'dynamic', mediaType: 'image', calculator: 'param-combination-pricing' },
  'midjourney-text-to-image': { type: 'fixed', credits: 50, mediaType: 'image' },
  'image-to-video-midjourney': { type: 'dynamic', mediaType: 'video', calculator: 'param-combination-pricing' },
  'nano-banana-2-text-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'param-combination-pricing' },
  'nano-banana-2-image-to-image': { type: 'dynamic', mediaType: 'image', calculator: 'param-combination-pricing' },
};

// scene -> 页面路由（按 /api/ai/{scene}/generate 的实际调用对应）
const URL_OVERRIDES: Record<string, string> = {
  'z-image-turbo-text-to-image': '/text-to-image/z-image-turbo',
  'image-to-image': '/image-to-image',
  'image-background-remover': '/image-background-remover',
  'image-eraser': '/image-eraser',
  'image-upscaler': '/image-upscaler',
  'seedream-v4-5-text-to-image': '/text-to-image/seedream-4-5',
  'nano-banana-text-to-image': '/text-to-image/nano-banana',
  'nano-banana-pro-text-to-image': '/text-to-image/nano-banana-pro',
  'qwen-202512-text-to-image': '/text-to-image/qwen-image-202512',
  'gpt-image-1-text-to-image': '/text-to-image/gpt-image-1',
  'gpt-image-2-text-to-image': '/text-to-image/gpt-image-2',
  'flux-2-klein-text-to-image': '/text-to-image/flux-2-klein',
  'midjourney-text-to-image': '/text-to-image/midjourney',
  'nano-banana-2-text-to-image': '/text-to-image/nano-banana-2',

  'qwen-image-layered': '/qwen-image-layered',
  'z-image-turbo-image-to-image': '/image-to-image/z-image-turbo',
  'flux-2-klein-image-to-image': '/image-to-image/flux-2-klein',
  'seedream-5-0-lite-image-to-image': '/image-to-image/seedream-5-0-lite',
  'qwen-image-max-image-to-image': '/image-to-image/qwen-image-max',
  'gpt-image-2-image-to-image': '/image-to-image/gpt-image-2',
  'nano-banana-image-to-image': '/image-to-image/nano-banana',
  'nano-banana-pro-edit-ultra': '/image-to-image/nano-banana-pro-edit-ultra',
  'nano-banana-2-image-to-image': '/image-to-image/nano-banana-2',
  'grok-imagine-image': '/image-to-image/grok-imagine-image',
  'soul-image-to-image': '/image-to-image/soul',

  'text-to-video-veo-3-1': '/text-to-video/veo-3-1',
  'text-to-video-ltx-2-fast': '/text-to-video/ltx2-fast',
  'text-to-video-ltx-2-pro': '/pricing',
  'text-to-video-wan-2-6': '/text-to-video/wan-2-6',
  'text-to-video-seedance-1-5-pro': '/text-to-video/seedance-1-5-pro',
  'text-to-video-pixverse-5-6': '/text-to-video/pixverse-5-6',
  'text-to-video-happyhorse-1-0': '/text-to-video/happyhorse-1-0',

  'image-to-video-veo-3-1': '/image-to-video/veo-3-1',
  'image-to-video-ltx-2-fast': '/image-to-video/ltx2-fast',
  'image-to-video-ltx-2-pro': '/pricing',
  'image-to-video-seedance-1-5-pro': '/image-to-video/seedance-1-5-pro',
  'image-to-video-pixverse-5-6': '/image-to-video/pixverse-5-6',
  'image-to-video-vidu-q3': '/image-to-video/vidu-q3',
  'image-to-video-happyhorse-1-0': '/image-to-video/happyhorse-1-0',
  'image-to-video-midjourney': '/image-to-video/midjourney',

  'video-face-swap': '/video-face-swap',
  'motion-control-kling-2-6': '/motion-control/kling-2-6-pro',
  'longcat-avatar': '/longcat-avatar',
  'generate-video': '/ai-video-generator',
  'seedream-5-0-lite-text-to-image': '/text-to-image/seedream-5-0-lite',
};

function toPathFromModel(model: string): string {
  return URL_OVERRIDES[model] ?? '/pricing';
}

function getUnit(config: CreditCostConfig): string {
  if (config.type === 'fixed') return 'one request';
  switch (config.calculator) {
    case 'gpt-image-1':
      return 'size + quality';
    case 'per-layer':
      return 'per layer';
    case 'duration-based':
      return 'duration';
    case 'duration-block-resolved':
      return 'duration + size';
    case 'step-based':
      return 'per step';
    case 'seedance-duration':
      return 'duration + resolution';
    case 'tier-based':
      return 'tiers';
    case 'param-combination-pricing':
      return 'params combination';
    default:
      return 'depends on params';
  }
}

function getOption(config: CreditCostConfig): string {
  if (config.type === 'fixed') return 'Fixed';
  return config.calculator ? `Dynamic (${config.calculator})` : 'Dynamic';
}

function getCategory(mediaType: CreditCostConfig['mediaType']): CreditsCostItem['category'] {
  if (mediaType === 'video') return 'video';
  if (mediaType === 'image') return 'image';
  return 'ai';
}

const VENDOR_LOGO_BY_MODEL: Record<string, { logo: string; name: string }> = {
  // joymagic / internal
  'z-image-turbo-text-to-image': { logo: '/logo.png', name: 'joymagic' },
  'image-to-image': { logo: '/logo.png', name: 'joymagic' },
  'image-background-remover': { logo: '/logo.png', name: 'joymagic' },
  'image-eraser': { logo: '/logo.png', name: 'joymagic' },
  'image-upscaler': { logo: '/logo.png', name: 'joymagic' },
  'z-image-turbo-image-to-image': { logo: '/logo.png', name: 'joymagic' },
  'video-face-swap': { logo: '/logo.png', name: 'joymagic' },
  'longcat-avatar': { logo: '/logo.png', name: 'joymagic' },
  'generate-video': { logo: '/logo.png', name: 'joymagic' },
  'soul-image-to-image': { logo: 'https://ocdn.10b.ai/icon/higgsfield-seeklogo.svg', name: 'Higgsfield' },

  // Google
  'nano-banana-text-to-image': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'nano-banana-pro-text-to-image': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'nano-banana-image-to-image': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'nano-banana-pro-edit-ultra': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'nano-banana-2-text-to-image': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'nano-banana-2-image-to-image': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'text-to-video-veo-3-1': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },
  'image-to-video-veo-3-1': { logo: getLobeIconUrl('google', 'color'), name: 'Google' },

  // OpenAI
  'gpt-image-1-text-to-image': { logo: getLobeIconUrl('openai', 'mono'), name: 'OpenAI' },
  'gpt-image-2-text-to-image': { logo: getLobeIconUrl('openai', 'mono'), name: 'OpenAI' },
  'gpt-image-2-image-to-image': { logo: getLobeIconUrl('openai', 'mono'), name: 'OpenAI' },

  // Alibaba
  'qwen-202512-text-to-image': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },
  'qwen-image-layered': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },
  'qwen-image-max-image-to-image': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },
  'text-to-video-wan-2-6': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },
  'text-to-video-happyhorse-1-0': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },
  'image-to-video-happyhorse-1-0': { logo: getLobeIconUrl('alibabacloud', 'color'), name: 'Alibaba' },

  // ByteDance
  'seedream-v4-5-text-to-image': { logo: getLobeIconUrl('bytedance', 'color'), name: 'ByteDance' },
  'seedream-5-0-lite-text-to-image': { logo: getLobeIconUrl('bytedance', 'color'), name: 'ByteDance' },
  'seedream-5-0-lite-image-to-image': { logo: getLobeIconUrl('bytedance', 'color'), name: 'ByteDance' },
  'text-to-video-seedance-1-5-pro': { logo: getLobeIconUrl('bytedance', 'color'), name: 'ByteDance' },
  'image-to-video-seedance-1-5-pro': { logo: getLobeIconUrl('bytedance', 'color'), name: 'ByteDance' },

  // Midjourney
  'midjourney-text-to-image': { logo: getLobeIconUrl('midjourney', 'mono'), name: 'Midjourney' },
  'image-to-video-midjourney': { logo: getLobeIconUrl('midjourney', 'mono'), name: 'Midjourney' },

  // xAI
  'grok-imagine-image': { logo: getLobeIconUrl('xai', 'mono'), name: 'xAI' },

  // Black Forest Labs / FLUX
  'flux-2-klein-text-to-image': { logo: getLobeIconUrl('bfl', 'mono'), name: 'Black Forest Labs' },
  'flux-2-klein-image-to-image': { logo: getLobeIconUrl('bfl', 'mono'), name: 'Black Forest Labs' },

  // Lightricks / LTX
  'text-to-video-ltx-2-fast': { logo: getLobeIconUrl('lightricks', 'mono'), name: 'Lightricks' },
  'text-to-video-ltx-2-pro': { logo: getLobeIconUrl('lightricks', 'mono'), name: 'Lightricks' },
  'image-to-video-ltx-2-fast': { logo: getLobeIconUrl('lightricks', 'mono'), name: 'Lightricks' },
  'image-to-video-ltx-2-pro': { logo: getLobeIconUrl('lightricks', 'mono'), name: 'Lightricks' },

  // PixVerse
  'text-to-video-pixverse-5-6': { logo: getLobeIconUrl('pixverse', 'color'), name: 'PixVerse' },
  'image-to-video-pixverse-5-6': { logo: getLobeIconUrl('pixverse', 'color'), name: 'PixVerse' },

  // Vidu
  'image-to-video-vidu-q3': { logo: getLobeIconUrl('vidu', 'color'), name: 'Vidu' },

  // Kling
  'motion-control-kling-2-6': { logo: getLobeIconUrl('kling', 'color'), name: 'Kling' },
};

function getVendorInfo(model: string): { logo: string; name: string } {
  return VENDOR_LOGO_BY_MODEL[model] ?? { logo: '/logo.png', name: 'joymagic' };
}

const creditsCostData: CreditsCostItem[] = Object.entries(CREDIT_COSTS_CONFIG)
  .filter(([model]) => {
    if (!isCreemReviewMode()) return true;
    return !REVIEW_BLOCKED_CREDIT_SCENARIOS.has(model);
  })
  .map(([model, config]) => ({
    vendorLogo: getVendorInfo(model).logo,
    vendorName: getVendorInfo(model).name,
    url: toPathFromModel(model),
    model,
    option: getOption(config),
    unit: getUnit(config),
    credits:
      config.type === 'fixed'
        ? (config.credits ?? '-')
        : typeof config.credits === 'number'
          ? config.credits
          : 'Dynamic',
    category: getCategory(config.mediaType),
  }));

function getCreditsBadgeVariant(credits: number | string): 'default' | 'secondary' | 'outline' {
  if (typeof credits !== 'number') return 'outline';
  if (credits <= 10) return 'secondary';
  if (credits <= 50) return 'outline';
  return 'default';
}

export function CreditsCostTable({ className }: { className?: string }) {
  return (
    <section className={`py-16 md:py-24 ${className ?? ''}`}>
      <div className="mx-auto max-w-full px-4 md:max-w-7xl md:px-8">
        <div className="mx-auto max-w-2xl text-center text-balance">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            Credits Cost Table
          </h2>
          <p className="mb-6 text-slate-600 md:mb-12 lg:mb-16">
            See how many credits each feature costs
          </p>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <div className="overflow-x-auto">
              <Table className="min-w-[900px] xl:min-w-0">
                <TableHeader>
                  <TableRow className="border-slate-200 bg-slate-50 hover:bg-slate-50">
                    <TableHead className="h-12 pl-6 text-slate-700">Model</TableHead>
                    <TableHead className="h-12 w-36 text-slate-700">Option</TableHead>
                    <TableHead className="h-12 text-slate-700">Unit</TableHead>
                    <TableHead className="h-12 text-right text-slate-700">Credits</TableHead>
                    <TableHead className="h-12 pr-6 text-right text-slate-700">Max Avg. Cost ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditsCostData.map((item, idx) => (
                    <TableRow
                      key={idx}
                      className="group border-slate-200 transition-colors hover:bg-slate-50/80"
                    >
                      <TableCell className="pl-6 whitespace-normal">
                        <Link
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-primary transition-colors hover:text-primary/80"
                        >
                          <span className="mt-0.5 shrink-0 text-slate-500 transition-colors group-hover:text-primary">
                            <img
                              src={item.vendorLogo}
                              alt={item.vendorName}
                              className="size-4 rounded-sm bg-white p-0.5 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/logo.png';
                              }}
                            />
                          </span>
                          <span className="break-words font-medium text-slate-900">{item.model}</span>
                        </Link>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="whitespace-pre-line text-slate-600">{item.option}</span>
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <span className="text-sm text-slate-600">{item.unit}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getCreditsBadgeVariant(item.credits)} className="border-slate-200 bg-white font-semibold text-slate-900">
                          {typeof item.credits === 'number' ? `${item.credits} credits` : item.credits}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <span className="font-medium text-slate-900">
                          {typeof item.credits === 'number' ? `$${(item.credits * 0.01).toFixed(2)}` : '-'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
          {creditsCostData.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <Link
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-w-0 items-start gap-2 text-primary transition-colors hover:text-primary/80"
                >
                  <span className="mt-0.5 shrink-0 text-slate-500">
                    <img
                      src={item.vendorLogo}
                      alt={item.vendorName}
                      className="size-4 rounded-sm bg-white p-0.5 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logo.png';
                      }}
                    />
                  </span>
                  <span className="min-w-0 break-words text-sm font-medium text-slate-900">{item.model}</span>
                </Link>
                <Badge variant={getCreditsBadgeVariant(item.credits)} className="shrink-0 border-slate-200 bg-white font-semibold text-slate-900">
                  {typeof item.credits === 'number' ? `${item.credits} credits` : item.credits}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-500">Option</p>
                  <p className="whitespace-pre-line break-words text-slate-700">{item.option}</p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-500">Unit</p>
                  <p className="break-words text-slate-700">{item.unit}</p>
                </div>
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-500">Max Avg.</p>
                  <p className="font-medium text-slate-900">
                    {typeof item.credits === 'number' ? `$${(item.credits * 0.01).toFixed(2)}` : '-'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
