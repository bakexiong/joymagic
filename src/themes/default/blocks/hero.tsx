"use client";

import { useTranslations } from "next-intl";
import React, { type ReactNode, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Image from "next/image";

import { Link, usePathname } from "@/core/i18n/navigation";
import { SmartIcon } from "@/shared/blocks/common/smart-icon";
import { ProductTabs } from "@/shared/blocks/common/product-tabs";

// 首页不渲染 Workbench，改为懒加载减少首屏 JS 体积
const DesktopImageAiWorkbench = lazy(() =>
  import("@/shared/blocks/common/desktop-image-ai-workbench").then((m) => ({
    default: m.DesktopImageAiWorkbench,
  })),
);
const MobileImageAiWorkbench = lazy(() =>
  import("@/shared/blocks/common/mobile-image-ai-workbench").then((m) => ({
    default: m.MobileImageAiWorkbench,
  })),
);
import { Button } from "@/shared/components/ui/button";
import { Highlighter } from "@/shared/components/ui/highlighter";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { isMobileAiWorkbenchPath } from "@/shared/lib/ai-paths";
import { landingSidebarRowCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import { Post as BlogPostType } from "@/shared/types/blocks/blog";
import { Hero as HeroType } from "@/shared/types/blocks/landing";

import { HeroImageWall } from "./hero-image-wall";
import { WavespeedImageGenerator } from "./wavespeed-image-generator";

// 动态导入 AnimatedGridPattern 以减少初始 JavaScript 包大小
const AnimatedGridPattern = lazy(() =>
  import("@/shared/components/ui/animated-grid-pattern").then((mod) => ({
    default: mod.AnimatedGridPattern,
  })),
);

const createFadeInVariant = (delay: number) => ({
  initial: {
    opacity: 0,
    y: 20,
    filter: "blur(6px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
  },
  transition: {
    duration: 0.6,
    delay,
    ease: [0.22, 1, 0.36, 1] as const,
  },
  // 优化动画性能
  style: {
    willChange: "transform, opacity, filter",
  },
});

function LatestBlogPosts({ posts }: { posts?: BlogPostType[] }) {
  const tBlog = useTranslations("blog.blog");
  const tPage = useTranslations("blog.page");

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 w-full px-3 pb-16 pt-4 sm:px-6 md:px-10">
      <div className="mx-auto w-full max-w-6xl rounded-3xl border border-white/5 bg-gradient-to-b from-white/5 via-white/0 to-background/40 p-6 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.8)] backdrop-blur">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-300/80">
              {tPage("crumb")}
            </p>
            <h3 className="text-foreground text-2xl font-semibold leading-tight">
              {tBlog("title")}
            </h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {tBlog("description")}
            </p>
          </div>

          <Button
            asChild
            size="sm"
            variant="ghost"
            className="border border-white/10 bg-white/5 px-4 text-xs font-semibold uppercase tracking-[0.12em] text-foreground shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-amber-300/70 hover:text-amber-100"
          >
            <Link href="/blog" className="flex items-center gap-2">
              {tBlog("title")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug || post.id || post.title}
              href={post.url || "/blog"}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 outline-none ring-1 ring-white/5 transition duration-300 ease-out hover:-translate-y-1 hover:ring-amber-400/70 focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {post.image ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800/50">
                  <Image
                    src={post.image}
                    alt={post.title || ""}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.02] group-hover:brightness-110"
                    loading="lazy"
                    quality={60}
                  />
                </div>
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-amber-500/40 via-pink-500/30 to-indigo-500/30 text-center text-sm font-semibold uppercase tracking-[0.1em] text-white/80">
                  {tBlog("title")}
                </div>
              )}

              <div className="flex flex-1 flex-col gap-3 p-4">
                <h4 className="text-foreground line-clamp-2 text-lg font-semibold leading-tight">
                  {post.title}
                </h4>
                <p className="text-muted-foreground line-clamp-3 flex-1 text-sm leading-relaxed">
                  {post.description}
                </p>
                <div className="text-muted-foreground mt-auto flex items-center justify-between text-xs">
                  {post.created_at && (
                    <span className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      {post.created_at}
                    </span>
                  )}
                  <ArrowRight className="size-4 text-amber-300 opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Hero({
  hero,
  className,
  latestPosts,
  customModule,
  templateWall,
  showProductTabs,
  showGenerator = true,
  showDesktopWorkbench = true,
  showInlineGenerator = true,
  showBackgroundGrid = true,
  headerNavItems,
  showcaseGallery,
  hideTitle = false,
  minHeight = "600px",
  /** 由页面侧单独渲染标题/短免责（如 Landing V2）时置 true，避免与本组件内重复 DOM */
  suppressPostShowcaseHeroCopy = false,
  /** 是否展示首页底部最新博客卡片区 */
  showLatestBlogPosts = true,
}: {
  hero: HeroType;
  className?: string;
  latestPosts?: BlogPostType[];
  /**
   * 可传入自定义模块替换默认的 Wavespeed 区块
   */
  customModule?: ReactNode;
  /**
   * 可传入自定义图片墙模块，不传则不展示
   */
  templateWall?: ReactNode;
  /**
   * 是否显示产品 tabs（Image AI 和 Video AI）
   */
  showProductTabs?: boolean;
  /**
   * 是否显示默认生成表单模块
   */
  showGenerator?: boolean;
  /**
   * 是否显示桌面端工作台
   */
  showDesktopWorkbench?: boolean;
  /**
   * 是否显示内联生成表单
   */
  showInlineGenerator?: boolean;
  /**
   * 是否显示背景网格动画
   */
  showBackgroundGrid?: boolean;
  /**
   * Header 导航菜单项，用于 ProductTabs
   */
  headerNavItems?: any[];
  /**
   * Showcase Gallery 瀑布流模块
   */
  showcaseGallery?: ReactNode;
  /**
   * 是否隐藏标题
   */
  hideTitle?: boolean;
  /**
   * 自定义 Hero 最小高度
   */
  minHeight?: string;
  suppressPostShowcaseHeroCopy?: boolean;
  showLatestBlogPosts?: boolean;
}) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const highlightText = hero.highlight_text ?? "";
  let texts = null;
  if (highlightText) {
    texts = hero.title?.split(highlightText, 2);
  }
  const useMobileImageWorkbench =
    showGenerator && isMobile && isMobileAiWorkbenchPath(pathname);
  const isDesktopImageWorkbenchPath =
    pathname.startsWith("/text-to-image") ||
    pathname.startsWith("/image-to-image");
  const useDesktopImageWorkbench =
    showGenerator &&
    showDesktopWorkbench &&
    !isMobile &&
    isDesktopImageWorkbenchPath;
  const shouldHideDesktopHeroCopy = hideTitle || useDesktopImageWorkbench;
  /** 仅自定义模块（如首页 Composer）、无大标题/无默认生成器时，避免沿用 pt-24/md:pt-36 造成顶栏下过大空白 */
  const compactCustomModuleHero =
    Boolean(customModule) && !showGenerator && hideTitle;

  return (
    <>
      {useMobileImageWorkbench ? (
        <MobileImageAiWorkbench
          headerNavItems={headerNavItems}
          fallbackTitle={hero.title}
          playground={
            customModule ?? (
              <WavespeedImageGenerator
                className="relative z-10 mx-auto w-full max-w-[92rem]"
                ctaButtons={hero.buttons}
              />
            )
          }
        />
      ) : null}
      {useMobileImageWorkbench ? (
        <div className="dark bg-[#050505] text-foreground [--background:oklch(0.098_0_0)] [--foreground:oklch(0.95_0_0)] [--card:oklch(0.24_0_0)] [--card-foreground:oklch(0.95_0_0)] [--popover:oklch(0.24_0_0)] [--popover-foreground:oklch(0.95_0_0)] [--sidebar:oklch(0.24_0_0)] [--muted:oklch(0.23_0_0)] [--muted-foreground:oklch(0.76_0_0)] [--accent:oklch(0.26_0_0)] [--accent-foreground:oklch(0.95_0_0)] [--border:oklch(0.34_0_0)] [--input:oklch(0.34_0_0)] [--ring:oklch(0.92_0_0)] [--primary:oklch(0.92_0_0)] [--primary-foreground:oklch(0.16_0_0)] md:hidden">
          <section className="px-4 pb-12 pt-8">
            <div className="mx-auto max-w-[74rem] text-center">
              <motion.div {...createFadeInVariant(0.1)}>
                {texts && texts.length > 0 ? (
                  <h1 className="text-4xl font-semibold text-balance text-white">
                    {texts[0]}
                    <Highlighter action="underline" color="#FF9800">
                      {highlightText}
                    </Highlighter>
                    {texts[1]}
                  </h1>
                ) : (
                  <h1 className="text-4xl font-semibold text-balance text-white">
                    {hero.title}
                  </h1>
                )}
              </motion.div>
              <noscript>
                <h1 className="text-4xl font-semibold text-balance text-white mt-4">
                  {hero.title}
                </h1>
              </noscript>

              <motion.p
                {...createFadeInVariant(0.2)}
                className="mt-6 text-base text-balance text-white/72"
                dangerouslySetInnerHTML={{ __html: hero.description ?? "" }}
              />
              <noscript>
                <p className="mt-6 text-base text-balance text-white/72">
                  {hero.description}
                </p>
              </noscript>
            </div>
          </section>

          {/* Disclaimer Section */}
          <section className="relative w-full bg-[#050505] px-3 pb-8 pt-8 sm:px-6 md:px-10 md:pt-4">
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/6 bg-gradient-to-b from-white/6 via-transparent to-[#17171b] px-6 py-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur">
              <p className="text-muted-foreground text-center text-sm leading-relaxed">
                <span className="font-semibold text-foreground">
                  Barko Bear
                </span>{" "}
                is an independent AI service and is not affiliated with any
                model provider. We deploy and optimize Apache-2.0 licensed
                models on our own infrastructure.
              </p>
            </div>
            <noscript>
              <div className="mx-auto max-w-4xl rounded-2xl border border-white/6 bg-gradient-to-b from-white/6 via-transparent to-[#17171b] px-6 py-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur mt-4">
                <p className="text-muted-foreground text-center text-sm leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Barko Bear
                  </span>{" "}
                  is an independent AI service and is not affiliated with any
                  model provider. We deploy and optimize Apache-2.0 licensed
                  models on our own infrastructure.
                </p>
              </div>
            </noscript>
          </section>

          {templateWall}
          {showLatestBlogPosts ? <LatestBlogPosts posts={latestPosts} /> : null}
        </div>
      ) : null}
      <section
        id={hero.id}
        className={cn(
          "relative bg-[#050505]",
          useDesktopImageWorkbench && "pt-0 pb-16 md:pb-12",
          !useDesktopImageWorkbench &&
            compactCustomModuleHero &&
            "pt-4 pb-12 md:pt-5 md:pb-14",
          !useDesktopImageWorkbench &&
            !compactCustomModuleHero &&
            "pt-24 pb-20 md:pt-36 md:pb-16",
          useMobileImageWorkbench && "hidden md:block",
          hero.className,
          className,
        )}
        style={
          compactCustomModuleHero && minHeight === "600px"
            ? undefined
            : { minHeight }
        }
      >
        {/* Content */}
        <div className="relative z-10">
          {hero.announcement && (
            <motion.div {...createFadeInVariant(0)}>
              <Link
                href={hero.announcement.url || ""}
                target={hero.announcement.target || "_self"}
                className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto mb-8 flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
              >
                <span className="text-foreground text-sm">
                  {hero.announcement.title}
                </span>
                <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                  <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                    <span className="flex size-6">
                      <ArrowRight className="m-auto size-3" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {!shouldHideDesktopHeroCopy && (
            <div className="relative mx-auto max-w-[74rem] px-4 text-center">
              <motion.div {...createFadeInVariant(0.15)}>
                {texts && texts.length > 0 ? (
                  <h1 className="text-foreground text-5xl font-semibold text-balance sm:mt-12 sm:text-7xl">
                    {texts[0]}
                    <Highlighter action="underline" color="#FF9800">
                      {highlightText}
                    </Highlighter>
                    {texts[1]}
                  </h1>
                ) : (
                  <h1 className="text-foreground text-5xl font-semibold text-balance sm:mt-12 sm:text-7xl">
                    {hero.title}
                  </h1>
                )}
              </motion.div>
              <noscript>
                <h1 className="text-foreground text-5xl font-semibold text-balance sm:mt-12 sm:text-7xl mt-4">
                  {hero.title}
                </h1>
              </noscript>

              <motion.p
                {...createFadeInVariant(0.3)}
                className="text-muted-foreground mt-8 mb-8 text-lg text-balance"
                dangerouslySetInnerHTML={{ __html: hero.description ?? "" }}
              />
              <noscript>
                <p className="text-muted-foreground mt-8 mb-8 text-lg text-balance">
                  {hero.description}
                </p>
              </noscript>

              {showProductTabs && !useDesktopImageWorkbench && (
                <motion.div {...createFadeInVariant(0.45)} className="mt-4">
                  <ProductTabs headerNavItems={headerNavItems} />
                </motion.div>
              )}
            </div>
          )}

          {showGenerator &&
            showInlineGenerator &&
            !useDesktopImageWorkbench &&
            !isDesktopImageWorkbenchPath && (
              <div id="playground" className="-mt-1 px-4">
                {customModule ?? (
                  <WavespeedImageGenerator
                    className="relative z-10 mx-auto w-full max-w-[92rem]"
                    ctaButtons={hero.buttons}
                  />
                )}
              </div>
            )}

          {showGenerator && useDesktopImageWorkbench && (
            <div id="playground" className="-mt-1">
              <DesktopImageAiWorkbench
                headerNavItems={headerNavItems}
                fallbackTitle={hero.title}
                playground={
                  customModule ?? (
                    <WavespeedImageGenerator
                      className="relative z-10 mx-auto w-full max-w-[92rem]"
                      ctaButtons={hero.buttons}
                    />
                  )
                }
              />
            </div>
          )}

          {!showGenerator && customModule && (
            <div className="-mt-1">{customModule}</div>
          )}
        </div>
      </section>

      <div
        className={cn(
          "bg-[#050505]",
          useMobileImageWorkbench && "hidden md:block",
        )}
      >
        {templateWall}
        {showcaseGallery}

        {useDesktopImageWorkbench && (
          <section className="relative bg-[#050505] py-16">
            <div className="relative z-10">
              <div
                className={landingSidebarRowCn(
                  "relative mx-auto max-w-[74rem] px-4 text-center",
                )}
              >
                <motion.div {...createFadeInVariant(0.15)}>
                  {texts && texts.length > 0 ? (
                    <h1 className="text-foreground text-5xl font-semibold text-balance sm:text-7xl">
                      {texts[0]}
                      <Highlighter action="underline" color="#FF9800">
                        {highlightText}
                      </Highlighter>
                      {texts[1]}
                    </h1>
                  ) : (
                    <h1 className="text-foreground text-5xl font-semibold text-balance sm:text-7xl">
                      {hero.title}
                    </h1>
                  )}
                </motion.div>

                <motion.p
                  {...createFadeInVariant(0.3)}
                  className="text-muted-foreground mt-8 text-lg text-balance"
                  dangerouslySetInnerHTML={{ __html: hero.description ?? "" }}
                />
              </div>
            </div>
          </section>
        )}

        {/* 标题区域 - 移到瀑布流下方 */}
        {hideTitle && !suppressPostShowcaseHeroCopy && (
          <section className="relative bg-[#050505] py-16">
            <div className="relative z-10">
              <div
                className={landingSidebarRowCn(
                  "relative mx-auto max-w-[74rem] px-4 text-center",
                )}
              >
                <motion.div {...createFadeInVariant(0.15)}>
                  {texts && texts.length > 0 ? (
                    <h1 className="text-foreground text-5xl font-semibold text-balance sm:text-7xl">
                      {texts[0]}
                      <Highlighter action="underline" color="#FF9800">
                        {highlightText}
                      </Highlighter>
                      {texts[1]}
                    </h1>
                  ) : (
                    <h1 className="text-foreground text-5xl font-semibold text-balance sm:text-7xl">
                      {hero.title}
                    </h1>
                  )}
                </motion.div>

                <motion.p
                  {...createFadeInVariant(0.3)}
                  className="text-muted-foreground mt-8 text-lg text-balance"
                  dangerouslySetInnerHTML={{ __html: hero.description ?? "" }}
                />
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer Section */}
        {!suppressPostShowcaseHeroCopy && (
          <section className="relative w-full bg-[#050505] px-3 pb-8 pt-8 sm:px-6 md:px-10 md:pt-4">
            <div className="mx-auto max-w-4xl rounded-2xl border border-white/6 bg-gradient-to-b from-white/6 via-transparent to-[#17171b] px-6 py-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur">
              <p className="text-muted-foreground text-center text-sm leading-relaxed">
                <span className="font-semibold text-foreground">
                  Barko Bear
                </span>{" "}
                is an independent AI service and is not affiliated with any
                model provider. We deploy and optimize Apache-2.0 licensed
                models on our own infrastructure.
              </p>
            </div>
            <noscript>
              <div className="mx-auto max-w-4xl rounded-2xl border border-white/6 bg-gradient-to-b from-white/6 via-transparent to-[#17171b] px-6 py-4 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.5)] backdrop-blur mt-4">
                <p className="text-muted-foreground text-center text-sm leading-relaxed">
                  <span className="font-semibold text-foreground">
                    Barko Bear
                  </span>{" "}
                  is an independent AI service and is not affiliated with any
                  model provider. We deploy and optimize Apache-2.0 licensed
                  models on our own infrastructure.
                </p>
              </div>
            </noscript>
          </section>
        )}

        {showLatestBlogPosts ? <LatestBlogPosts posts={latestPosts} /> : null}
      </div>

      {/* {hero.image && (
        <motion.section
          className="border-foreground/10 relative mt-8 border-y sm:mt-16"
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            delay: 0.9,
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1] as const,
          }}
          style={{
            willChange: 'transform, opacity',
          }}
        >
          <div className="relative z-10 mx-auto max-w-6xl border-x px-3">
            <div className="border-x">
              <div
                aria-hidden
                className="h-3 w-full bg-[repeating-linear-gradient(-45deg,var(--color-foreground),var(--color-foreground)_1px,transparent_1px,transparent_4px)] opacity-5"
              />
              <Image
                className="border-border/25 relative z-2 hidden border dark:block"
                src={hero.image_invert?.src || hero.image?.src || ''}
                alt={hero.image_invert?.alt || hero.image?.alt || ''}
                width={1200}
                height={675}
                loading="lazy"
                quality={75}
              />
              <Image
                className="border-border/25 relative z-2 border dark:hidden"
                src={hero.image?.src || hero.image_invert?.src || ''}
                alt={hero.image?.alt || hero.image_invert?.alt || ''}
                width={1200}
                height={675}
                loading="lazy"
                quality={75}
              />
            </div>
          </div>
        </motion.section>
      )} */}

      {showBackgroundGrid && !useMobileImageWorkbench && (
        <Suspense fallback={null}>
          <AnimatedGridPattern
            numSquares={30}
            maxOpacity={0.1}
            duration={3}
            repeatDelay={1}
            className={cn(
              "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]",
              "inset-x-0 inset-y-[-30%] h-[200%] skew-y-12",
            )}
          />
        </Suspense>
      )}
    </>
  );
}
