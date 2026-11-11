'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';

import { Dialog, DialogContent } from '@/shared/components/ui/dialog';

const galleryImages = [
    'https://cdn.10b.ai/new%20year%206.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6tu8GAb0AAWrn8.jpeg',
    'https://cdn.10b.ai/Christmas%208.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6-4JxPbkAcFhzv.jpeg',
    'https://cdn.10b.ai/new%20year3.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6sKg71bgAAD86U.jpeg',
    'https://cdn.10b.ai/Christmas%207.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6-C4kvbkAQj6Uc.jpeg',
    'https://cdn.10b.ai/new%20year%207.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6wJm05WYAAUKWm.jpeg',
    'https://cdn.10b.ai/Christmas%205.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6-mbJVbcAA37f_.jpeg',
    'https://cdn.10b.ai/new%20year%204.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6-mdeEbkAMTBPE.jpeg',
    'https://cdn.10b.ai/Christmas%203.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G606Sjha0AA3QuA.jpeg',
    'https://cdn.10b.ai/new%20year%202.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G60n4Aea0AAkMii.jpeg',
    'https://cdn.10b.ai/Christmas%202.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G60n4Aha0AEya8F.jpeg',
    'https://cdn.10b.ai/new%20year%201.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G60vxl1a0AAEEHu.jpeg',
    'https://cdn.10b.ai/Christmas%2010.webp',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G618SVdbQAAfyez.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G61BBCBa0AIIgb8.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G62vEIQakAASPSu.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G62vGKjbIAA-pO8.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G62vJDiacAAV5lI.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6479nvbkAA1FyI.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G647wytaIAApYj0.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G670-tJWcAAKGyN.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6sKgYxbQAAGbp4.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6tu30kboAA45tW.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6tu6OTbIAABuFB.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6tyQnabEAAEBev.jpeg',
    'https://pub.wanai.pro/%E5%9B%BE%E7%89%87%E8%B5%84%E6%BA%90/G6wIpcfasAAEGOf.jpeg',
];

export function HeroImageWall() {
    const t = useTranslations('landing.heroImageWall');
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const activeImage = activeIndex !== null ? galleryImages[activeIndex] : null;

    return (
        <section className="relative w-full px-3 pb-14 pt-8 sm:px-6 md:px-10">
            <div className="mx-auto w-full rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 via-white/0 to-background/40 p-4 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80">
                            {t('label')}
                        </p>
                        <h2 className="text-foreground text-3xl font-semibold leading-tight">
                            {t('title')}
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {t('description')}
                        </p>
                    </div>
                    <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                        {t('hint')}
                    </span>
                </div>

                <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
                    {galleryImages.map((image, index) => (
                        <button
                            type="button"
                            key={image}
                            onClick={() => setActiveIndex(index)}
                            className="group relative mb-4 block w-full overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 outline-none ring-1 ring-white/5 transition duration-300 ease-out hover:-translate-y-1 hover:ring-amber-400/70 focus-visible:ring-2 focus-visible:ring-amber-400 break-inside-avoid"
                        >
                            <div className="relative w-full aspect-[3/4]">
                                <Image
                                    src={image}
                                    alt={t('alt', { index: index + 1 })}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-110"
                                    loading={index < 10 ? 'eager' : 'lazy'}
                                />
                            </div>
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/25 to-transparent opacity-70 transition duration-300 group-hover:opacity-40" />
                            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80 backdrop-blur">
                                {t('view')}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <Dialog
                open={Boolean(activeImage)}
                onOpenChange={(open) => {
                    if (!open) {
                        setActiveIndex(null);
                    }
                }}
            >
                <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/90 p-0">
                    {activeImage && (
                        <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4">
                            <div className="relative w-full h-full max-w-full max-h-[88vh]">
                                <Image
                                    src={activeImage}
                                    alt={`Gallery image ${activeIndex! + 1}`}
                                    width={1200}
                                    height={1600}
                                    className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
                                    priority
                                />
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}


