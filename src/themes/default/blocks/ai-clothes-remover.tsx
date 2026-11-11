'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Shirt, Sparkles, Upload, Wand2 } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';

const clothingTypes = ['Tops', 'Full Outfits', 'Bottoms'] as const;
type ClothingType = (typeof clothingTypes)[number];

export function AiClothesRemover({ className }: { className?: string }) {
    const [tab, setTab] = useState<'auto' | 'manual'>('auto');
    const [selectedType, setSelectedType] = useState<ClothingType>('Full Outfits');
    const [prompt, setPrompt] = useState('');
    const tCr = useTranslations('landing.clothesRemover');
    const t2 = useTranslations('landing.wavespeed');
    const [typeOpen, setTypeOpen] = useState(false);

    return (
        <motion.section
            className={cn('relative py-12 lg:py-16', className)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
        >
            <div className="mx-auto w-full max-w-6xl min-h-[820px] rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-background/60 p-6 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur">
                {/* Tabs - align size/style with video face swap */}
                <div className="mx-auto mb-6 flex w-full max-w-xs overflow-hidden rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold shadow-sm">
                    {(['auto', 'manual'] as const).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setTab(key)}
                            className={cn(
                                'flex-1 rounded-full px-4 py-2 transition',
                                tab === key
                                    ? 'bg-primary text-primary-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {key === 'auto' ? tCr('tabs.auto') : tCr('tabs.manual')}
                        </button>
                    ))}
                </div>

                <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
                    {/* Left steps */}
                    <div className="space-y-5 min-h-[760px]">
                        {tab === 'manual' ? (
                            <>
                                {/* manual step 1 */}
                                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                            1
                                        </span>
                                        {tCr('steps.upload.title')}
                                    </div>
                                    <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-slate-200">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="relative h-12 min-w-[180px] justify-center gap-2 bg-primary/15 text-primary hover:bg-primary/20"
                                        >
                                            <Upload className="h-5 w-5" />
                                            {tCr('steps.upload.cta')}
                                        </Button>
                                        <p className="text-xs text-slate-300">{tCr('steps.upload.hint')}</p>
                                    </div>
                                </div>
                                {/* manual step 2 */}
                                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                            2
                                        </span>
                                        {tCr('steps.describe.title')}
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={tCr('steps.describe.placeholder')}
                                            className="min-h-[120px] resize-none bg-white/5 text-sm"
                                            maxLength={500}
                                        />
                                        <p className="text-right text-xs text-slate-400">{prompt.length} / 500</p>
                                        <Button
                                            size="lg"
                                            className="mt-2 w-full justify-center gap-2 rounded-xl bg-gradient-to-r from-[#b08936] via-[#a15545] to-[#8a3b78] text-slate-900 shadow-[0_6px_22px_-6px_rgba(0,0,0,0.5)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.45)]"
                                        >
                                            <Wand2 className="h-5 w-5" />
                                            {tCr('actions.remove')}
                                        </Button>
                                        {/* 闪动的付费按钮 - 始终显示 */}
                                        <Button
                                            onClick={() => window.open('/pricing', '_blank')}
                                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg animate-pulse"
                                            size="lg"
                                        >
                                            <span className="mr-2">💳</span>
                                            {t2('buttons.click_to_pay')}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* step 1 */}
                                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                            1
                                        </span>
                                        {tCr('steps.type.title')}
                                    </div>
                                    <div className="mt-3 relative">
                                        <button
                                            type="button"
                                            onClick={() => setTypeOpen((v: boolean) => !v)}
                                            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 hover:bg-white/10"
                                        >
                                            <span className="flex items-center gap-2">
                                                <Shirt className="h-4 w-4" />
                                                {selectedType}
                                            </span>
                                            {typeOpen ? (
                                                <ChevronUp className="h-4 w-4" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" />
                                            )}
                                        </button>
                                        {typeOpen && (
                                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-white/15 bg-white/95 text-slate-900 shadow-2xl">
                                                {clothingTypes.map((item) => (
                                                    <button
                                                        key={item}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedType(item);
                                                            setTypeOpen(false);
                                                        }}
                                                        className={cn(
                                                            'flex w-full items-center gap-3 px-4 py-3 text-left text-base transition hover:bg-primary/10',
                                                            selectedType === item && 'text-primary font-semibold'
                                                        )}
                                                    >
                                                        <Shirt className="h-4 w-4" />
                                                        {item}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* step 2 */}
                                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                            2
                                        </span>
                                        {tCr('steps.upload.title')}
                                    </div>
                                    <div className="mt-3 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-slate-200">
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            className="relative h-12 min-w-[180px] justify-center gap-2 bg-primary/15 text-primary hover:bg-primary/20"
                                        >
                                            <Upload className="h-5 w-5" />
                                            {tCr('steps.upload.cta')}
                                        </Button>
                                        <p className="text-xs text-slate-300">{tCr('steps.upload.hint')}</p>
                                    </div>
                                </div>

                                {/* step 3 */}
                                <div className="rounded-2xl border border-white/10 bg-card/60 p-4 shadow-sm">
                                    <div className="flex items-center gap-3 text-sm font-semibold text-primary">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                                            3
                                        </span>
                                        {tCr('steps.describe.title')}
                                    </div>
                                    <div className="mt-3 space-y-3">
                                        <Textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder={tCr('steps.describe.placeholder')}
                                            className="min-h-[120px] resize-none bg-white/5 text-sm"
                                            maxLength={500}
                                        />
                                        <p className="text-right text-xs text-slate-400">{prompt.length} / 500</p>

                                        <Button
                                            size="lg"
                                            className="mt-4 w-full  bg-gradient-to-r from-[#b08936] via-[#a15545] to-[#8a3b78] px-6 py-5 text-lg font-semibold text-slate-900 shadow-[0_6px_22px_-6px_rgba(0,0,0,0.5)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_rgba(0,0,0,0.45)] disabled:opacity-70"
                                        >
                                            <Wand2 className="h-5 w-5" />
                                            Remove Clothing
                                        </Button>
                                        {/* 闪动的付费按钮 - 始终显示 */}
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
                            </>
                        )}
                    </div>

                    {/* Preview */}
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 via-zinc-900/70 to-black p-4 shadow-xl min-h-[420px]">
                        <div className="mb-4 flex items-center justify-between text-sm text-slate-200">
                            <span className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                Preview
                            </span>
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-100">
                                {tab === 'auto' ? 'Auto' : 'Manual'}
                            </span>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-white/70 p-2 text-center">
                                <div className="rounded-lg bg-white p-2 shadow-inner">
                                    <img
                                        src="https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/clothes-before.png"
                                        alt="Before"
                                        className="mx-auto h-[320px] w-full max-w-[280px] object-cover"
                                    />
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-white/70 p-2 text-center">
                                <div className="rounded-lg bg-white p-2 shadow-inner">
                                    <img
                                        src="https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/clothes-after.png"
                                        alt="After"
                                        className="mx-auto h-[320px] w-full max-w-[280px] object-cover"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

