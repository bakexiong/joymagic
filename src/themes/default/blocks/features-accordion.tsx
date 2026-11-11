'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { BorderBeam } from '@/shared/components/magicui/border-beam';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import {
  landingSidebarContainerCn,
  landingSidebarInnerCn,
} from '@/shared/lib/landing-sidebar-layout-classes';
import { cn } from '@/shared/lib/utils';
import { Features as FeaturesType } from '@/shared/types/blocks/landing';

export function FeaturesAccordion({
  features,
  className,
}: {
  features: FeaturesType;
  className?: string;
}) {
  const [activeItem, setActiveItem] = useState<string>('item-1');

  const images: any = {};
  features.items?.forEach((item, idx) => {
    images[`item-${idx + 1}`] = {
      image: item.image?.src ?? '',
      alt: item.image?.alt || item.title || '',
    };
  });

  return (
    // overflow-x-hidden to prevent horizontal scroll
    <section
      className={cn(
        'overflow-x-hidden py-16 md:py-24',
        className,
        'bg-[#050505]',
      )}
    >
      <div className="absolute inset-0 -z-10 bg-[#050505] sm:inset-6 sm:rounded-b-3xl"></div>
      {/* add overflow-x-hidden to container */}
      <div
        className={landingSidebarContainerCn(
          'container space-y-8 overflow-x-hidden px-2 sm:px-6 md:space-y-16 lg:space-y-20 dark:[--color-border:color-mix(in_oklab,var(--color-white)_10%,transparent)]',
        )}
      >
        <ScrollAnimation>
          <div
            className={cn(
              'mx-auto max-w-4xl text-center text-balance',
              'md:group-data-[layout=with-sidebar]/sidebar-layout:mx-auto'
            )}
          >
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {features.title}
            </h2>
            <p className="text-muted-foreground mb-6 md:mb-12 lg:mb-16">
              {features.description}
            </p>
          </div>
        </ScrollAnimation>

        {/* 与 Hero 等区块一致：双栏整体限宽并水平居中 */}
        <div
          className={cn('mx-auto w-full max-w-6xl')}
        >
          {/* 去掉 sm:px-6/lg:px-0，避免与 mx-auto 冲突 */}
          <div className="grid min-w-0 gap-12 md:grid-cols-2 lg:gap-20">
            <ScrollAnimation delay={0.1} direction="left">
              <Accordion
                type="single"
                value={activeItem}
                onValueChange={(value) => setActiveItem(value as string)}
                className="w-full"
              >
                {features.items?.map((item, idx) => (
                  <AccordionItem value={`item-${idx + 1}`} key={idx}>
                    <AccordionTrigger className="justify-center text-center">
                      <div className="flex items-center justify-center gap-2 text-center text-base">
                        {item.icon && (
                          <SmartIcon name={item.icon as string} size={24} />
                        )}
                        {item.title}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-center">{item.description}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollAnimation>

            <ScrollAnimation delay={0.2} direction="right">
              {/* min-w-0/flex-shrink to prevent overflow */}
              <div className="relative flex min-w-0 flex-shrink overflow-hidden rounded-3xl border border-white/8 bg-[#0a0a0a] p-2">
                <div className="absolute inset-0 right-0 ml-auto w-15 border-l bg-[repeating-linear-gradient(-45deg,var(--color-border),var(--color-border)_1px,transparent_1px,transparent_8px)]"></div>
                <div className="relative aspect-76/59 w-full min-w-0 rounded-2xl bg-[#0b0b0b] sm:w-[calc(3/4*100%+3rem)]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeItem}-id`}
                      initial={{ opacity: 0, y: 6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="size-full overflow-hidden rounded-2xl border bg-zinc-900 shadow-md"
                    >
                      <Image
                        src={images[activeItem].image}
                        className="size-full object-cover object-left-top dark:mix-blend-lighten"
                        alt={images[activeItem].alt}
                        width={1207}
                        height={929}
                        // prevent img from exceeding parent
                        style={{ maxWidth: '100%', height: 'auto' }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
                <BorderBeam
                  duration={6}
                  size={200}
                  className="from-transparent via-yellow-700 to-transparent dark:via-white/50"
                />
              </div>
            </ScrollAnimation>
          </div>
        </div>
      </div>
    </section>
  );
}
