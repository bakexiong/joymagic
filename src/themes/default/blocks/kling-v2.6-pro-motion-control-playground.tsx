'use client';

import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';
import { Kling26ProMotionControlPlayground as UnifiedKling26ProMotionControlPlayground } from '@/themes/default/blocks/ai-media-playgrounds';

export function KlingV26ProMotionControlPlayground({ className }: { className?: string }) {
    return (
        <motion.section
            className={cn('relative py-12 lg:py-16', className)}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }}
        >
            <div className="mx-auto w-full max-w-[92rem] px-4">
                <UnifiedKling26ProMotionControlPlayground />
            </div>
        </motion.section>
    );
}
