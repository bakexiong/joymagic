'use client';

import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { Features as FeaturesType } from '@/shared/types/blocks/landing';

export function Features({
  features,
  className,
}: {
  features: FeaturesType;
  className?: string;
}) {
  return (
    <section
      id={features.id}
      className={cn(
        'py-16 md:py-24',
        features.className,
        className,
        'bg-[#050505]',
      )}
    >
      <div className={`container space-y-8 md:space-y-16`}>
        <ScrollAnimation>
          <div className="mx-auto max-w-4xl text-center text-balance">
            <h2 className="text-foreground mb-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {features.title}
            </h2>
            <p className="text-muted-foreground mb-6 md:mb-12 lg:mb-16">
              {features.description}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="relative mx-auto overflow-hidden rounded-[28px] border border-white/8 bg-[#0a0a0a] shadow-[0_28px_72px_rgba(0,0,0,0.36)] backdrop-blur-sm">
            <div className="grid divide-x divide-y divide-white/10 *:p-12 sm:grid-cols-2 lg:grid-cols-3">
            {features.items?.map((item, idx) => (
              <div className="space-y-4 bg-transparent" key={idx}>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/75">
                    <SmartIcon name={item.icon as string} size={20} />
                  </div>
                  <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
                </div>
                <div
                  className="text-sm leading-7 text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: item.description || '' }}
                />
              </div>
            ))}
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
