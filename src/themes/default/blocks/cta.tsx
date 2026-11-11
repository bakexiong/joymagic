'use client';

import { Link } from '@/core/i18n/navigation';
import { SmartIcon } from '@/shared/blocks/common/smart-icon';
import { Button } from '@/shared/components/ui/button';
import { ScrollAnimation } from '@/shared/components/ui/scroll-animation';
import { cn } from '@/shared/lib/utils';
import { CTA as CTAType } from '@/shared/types/blocks/landing';

export function CTA({ cta, className }: { cta: CTAType; className?: string }) {
  return (
    <section
      id={cta.id}
      className={cn(
        'py-16 md:py-24',
        className,
        'bg-[#050505]',
      )}
    >
      <div className="container">
        <div className="mx-auto max-w-4xl rounded-[36px] border border-white/10 bg-[#0a0a0a] px-6 py-12 text-center shadow-[0_28px_80px_rgba(0,0,0,0.3)] backdrop-blur-sm sm:px-10 md:py-14">
          <ScrollAnimation>
            <h2 className="text-foreground text-4xl font-semibold text-balance lg:text-5xl">
              {cta.title}
            </h2>
          </ScrollAnimation>
          <ScrollAnimation delay={0.15}>
            <p
              className="text-muted-foreground mt-4 text-base leading-8"
              dangerouslySetInnerHTML={{ __html: cta.description ?? '' }}
            />
          </ScrollAnimation>

          <ScrollAnimation delay={0.3}>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              {cta.buttons?.map((button, idx) => (
                <Button
                  asChild
                  size={button.size || 'default'}
                  variant={button.variant || 'default'}
                  key={idx}
                  className="min-w-[170px] border border-white/20 bg-white text-black shadow-[0_16px_36px_rgba(0,0,0,0.24)] hover:bg-white/92"
                >
                  <Link
                    href={button.url || ''}
                    target={button.target || '_self'}
                  >
                    {button.icon && <SmartIcon name={button.icon as string} />}
                    <span>{button.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
}
