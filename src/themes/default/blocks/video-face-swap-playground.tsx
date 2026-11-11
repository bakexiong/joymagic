"use client";

import { motion } from "framer-motion";
// import { useState } from 'react';
// import { useTranslations } from 'next-intl';

import { cn } from "@/shared/lib/utils";
import { SingleFaceSwap } from "@/shared/blocks/faceswrap/single-face-swap";
// import { MultipleFaceSwap } from '@/shared/blocks/faceswrap/multiple-face-swap';

export function VideoFaceSwapPlayground({ className }: { className?: string }) {
  // const t = useTranslations('landing.faceSwap');
  // const [tab, setTab] = useState<'single' | 'multiple'>('single');

  // const handleTabChange = (newTab: 'single' | 'multiple') => {
  //     if (newTab !== tab) {
  //         setTab(newTab);
  //     }
  // };

  return (
    <motion.section
      className={cn("relative py-8 sm:py-12 lg:py-16", className)}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
    >
      <div className="mx-auto w-full max-w-6xl min-h-[620px] rounded-3xl border border-white/8 bg-gradient-to-b from-white/5 via-white/0 to-background/60 p-4 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur sm:min-h-[820px] sm:p-6">
        {/* Tab 切换暂时隐藏 */}
        {/* <div className="flex flex-col gap-4 text-center">
                    <div className="mx-auto flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold shadow-sm">
                        <button
                            type="button"
                            onClick={() => handleTabChange('single')}
                            className={cn(
                                'flex items-center gap-2 rounded-full px-4 py-2 transition',
                                tab === 'single'
                                    ? 'bg-primary text-primary-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {t('tabs.single')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTabChange('multiple')}
                            className={cn(
                                'flex items-center gap-2 rounded-full px-4 py-2 transition',
                                tab === 'multiple'
                                    ? 'bg-primary text-primary-foreground shadow'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {t('tabs.multiple')}
                        </button>
                    </div>
                </div> */}

        <div className="mt-8">
          <SingleFaceSwap />
          {/* {tab === 'single' ? (
                        <SingleFaceSwap />
                    ) : (
                        <MultipleFaceSwap />
                    )} */}
        </div>
      </div>
    </motion.section>
  );
}
