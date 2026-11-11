"use client";

import { motion } from "framer-motion";

import type { Hero as HeroType } from "@/shared/types/blocks/landing";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: {
    duration: 0.45,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
});

/**
 * Landing V2：标题 + 描述只保留一份 DOM，用同一套首屏结构适配移动端与桌面端。
 */
export function LandingV2HeroIntro({ hero }: { hero: HeroType }) {
  const highlightText = hero.highlight_text ?? "";
  const texts =
    highlightText && hero.title ? hero.title.split(highlightText, 2) : null;

  return (
    <section
      className="relative overflow-hidden bg-[#050505] text-foreground"
      aria-labelledby={hero.id ? `${hero.id}-heading` : undefined}
    >
      <div className="relative mx-auto max-w-[68rem] px-4 pt-12 text-center sm:pt-14 md:pt-16 lg:pt-20">
        <motion.div {...fade(0.06)}>
          {texts && texts.length > 0 ? (
            <h1
              id={hero.id ? `${hero.id}-heading` : undefined}
              className="text-foreground text-5xl font-semibold text-balance sm:text-7xl"
            >
              <span className="inline-block">{texts[0]}</span>
              <span className="relative mx-[0.08em] inline-block pb-[0.16em]">
                {highlightText}
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-[0.02em] h-[0.06em] rounded-full bg-[#FF9800]"
                />
              </span>
              <span className="inline-block">{texts[1]}</span>
            </h1>
          ) : (
            <h1
              id={hero.id ? `${hero.id}-heading` : undefined}
              className="text-foreground text-5xl font-semibold text-balance sm:text-7xl"
            >
              {hero.title}
            </h1>
          )}
        </motion.div>

        <noscript>
          <h2 className="text-foreground text-5xl font-semibold text-balance sm:text-7xl mt-4">
            {hero.title}
          </h2>
        </noscript>

        {hero.description ? (
          <motion.p
            {...fade(0.12)}
            className="font-mono mt-5 text-sm leading-relaxed text-balance text-white/70 sm:mt-6 sm:text-base md:mt-8 md:text-lg"
            dangerouslySetInnerHTML={{ __html: hero.description }}
          />
        ) : null}
        <noscript>
          {hero.description ? (
            <p className="font-mono mt-5 text-sm leading-relaxed text-balance text-white/70 sm:mt-6 sm:text-base md:mt-8 md:text-lg">
              {hero.description}
            </p>
          ) : null}
        </noscript>
      </div>

    </section>
  );
}
