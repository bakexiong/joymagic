import { ArrowRight, CheckCircle2, Layers3 } from "lucide-react";

import { Link } from "@/core/i18n/navigation";
import { ToolsDetailPage } from "@/shared/blocks/create/tools-detail-page";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import type { ModelLandingPageData } from "@/shared/lib/model-landing-data";
import { cn } from "@/shared/lib/utils";
import type { NavItem } from "@/shared/types/blocks/common";

type ModelLandingTemplateProps = {
  data: ModelLandingPageData;
  navItems: NavItem[];
  initialScene?: string;
  initialModel?: string;
  initialPrompt?: string;
  initialParams?: string;
  initialRef?: string;
  initialAuto?: boolean;
};

const FROST_BORDER = "border-black/12";
const FROST_BORDER_SOFT = "border-black/10";
const SECTION_LINE = "border-black/10";
const SURFACE_SOFT = "bg-black/[0.035]";
const MODULE_PANEL =
  "rounded-[30px] border border-black/10 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)]";
const PAGE_SECTION = "bg-[#f7f8fb]";
const TEXT_STRONG = "text-[#111827]";
const TEXT_NORMAL = "text-[#1f2937]";
const TEXT_MUTED = "text-[#5f6672]";
const TEXT_DIM = "text-[#8a9099]";

function buildModelPageHref(
  slug: string,
  sceneId: string,
  modelKey: string,
  options?: {
    auto?: boolean;
    prompt?: string;
  },
) {
  const params = new URLSearchParams({
    scene: sceneId,
    model: modelKey,
  });

  if (options?.prompt) {
    params.set("prompt", options.prompt);
  }

  if (options?.auto) {
    params.set("auto", "1");
  }

  return `/model/${slug}?${params.toString()}`;
}

function buildCreatorHref(sceneId: string, modelKey: string) {
  const params = new URLSearchParams({
    scene: sceneId,
    model: modelKey,
  });

  return `/creator?${params.toString()}`;
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className={cn("border-t px-0 py-10 md:py-14", SECTION_LINE)}>
      <div className="mx-auto max-w-5xl text-center">
        <h2
          className={cn(
            "text-[2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-balance md:text-[2.8rem] xl:text-[3rem]",
            TEXT_STRONG,
          )}
        >
          {title}
        </h2>
        {description ? (
          <p
            className={cn(
              "mx-auto mt-4 max-w-3xl text-[15px] leading-[1.75] md:text-[17px]",
              TEXT_MUTED,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ModelLandingTemplate({
  data,
  navItems,
  initialScene,
  initialModel,
}: ModelLandingTemplateProps) {
  const { templateCopy } = data;
  const isGptImage2Page = data.slug === "gpt-image-2";
  const activeScene =
    data.scenes.find(
      (scene) =>
        scene.sceneId === initialScene && scene.modelKey === initialModel,
    ) ||
    data.scenes.find(
      (scene) =>
        scene.sceneId === data.primarySceneId &&
        scene.modelKey === data.primaryModelKey,
    ) ||
    data.scenes.find((scene) => scene.modelKey === initialModel) ||
    data.scenes.find((scene) => scene.sceneId === initialScene) ||
    data.scenes[0];

  return (
    <div className={cn("min-h-screen bg-[#f7f8fb]", TEXT_NORMAL)}>
      <section className="relative overflow-visible bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.92),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.78),transparent_24%),linear-gradient(180deg,#F1F8FF_0%,#EAF5FF_52%,#F8FBFF_100%)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(circle_at_top,rgba(17,24,39,0.06),transparent_42%),radial-gradient(circle_at_15%_18%,rgba(17,255,153,0.1),transparent_20%),radial-gradient(circle_at_82%_16%,rgba(59,130,246,0.1),transparent_22%)]" />
        <div
          className={cn(
            "container relative pb-0 pt-[calc(var(--top-banner-h,0px)+var(--header-h,4.75rem)+3rem)] md:pt-[calc(var(--top-banner-h,0px)+var(--header-h,4.75rem)+3.5rem)]",
          )}
        >
          <div className={cn("max-w-5xl", isGptImage2Page && "max-w-[68rem]")}>
            {isGptImage2Page ? (
              <div className="grid gap-2 lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] lg:items-center xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <h1
                  className={cn(
                    "max-w-5xl font-serif text-[3.1rem] font-normal leading-[0.94] tracking-[-0.06em] md:text-[4.5rem] xl:text-[5.4rem]",
                    TEXT_STRONG,
                  )}
                >
                  {data.title}
                </h1>
                <div className="max-w-[29rem] lg:pt-2">
                  <p className="text-[13px] leading-[1.55] text-[#65717d] md:text-[14px] md:leading-[1.6]">
                    {data.description}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#11FF99]",
                      FROST_BORDER,
                    )}
                  >
                    {data.provider}
                  </span>
                </div>
                <h1
                  className={cn(
                    "mt-6 max-w-5xl font-serif text-[3.1rem] font-normal leading-[0.94] tracking-[-0.06em] md:text-[4.5rem] xl:text-[5.4rem]",
                    TEXT_STRONG,
                  )}
                >
                  {data.title}
                </h1>

                <p
                  className={cn(
                    "mt-5 max-w-3xl text-[16px] leading-[1.7] md:text-[18px]",
                    TEXT_MUTED,
                  )}
                >
                  {data.description}
                </p>
              </>
            )}

            <div className={cn("mt-8 flex flex-col gap-4")}>
              <div className="flex min-h-[40px] items-center justify-start">
                <div className="flex flex-wrap items-center justify-start gap-2">
                  {data.scenes.map((scene) => {
                    const isActive = scene.modelUrl === activeScene.modelUrl;

                    return (
                      <Link
                        key={scene.modelUrl}
                        href={buildModelPageHref(
                          data.slug,
                          scene.sceneId,
                          scene.modelKey,
                          {},
                        )}
                        className={cn(
                          "inline-flex min-h-[32px] items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium tracking-[0] transition",
                          FROST_BORDER,
                          isActive
                            ? "bg-[#111827] text-white"
                            : "text-[#1f2937] hover:bg-black/[0.04]",
                        )}
                      >
                        {scene.modeLabel}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="playground"
        className={cn("border-b", FROST_BORDER_SOFT, PAGE_SECTION)}
      >
        <div
          className={cn(
            "container pb-4 md:pb-6",
            isGptImage2Page
              ? "px-0 pb-2 pt-0 sm:px-1 md:px-1 md:pb-3 lg:px-0"
              : "pt-4 md:pt-6",
          )}
        >
          <div
            className={cn(
              "mx-auto w-full max-w-[1520px]",
              isGptImage2Page && "-mt-3 md:-mt-3 lg:-mt-3",
            )}
          >
            <ToolsDetailPage
              navItems={navItems}
              initialTool={activeScene.modelUrl.replace(/^\/+/, "")}
              renderMode="studio"
            />
          </div>
        </div>
      </section>

      <section className={PAGE_SECTION}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.whyModelTitle}
            description={templateCopy.whyModelDescription}
          />

          <div
            className={cn(
              "grid gap-6 border-t py-10 md:grid-cols-3 md:py-14",
              SECTION_LINE,
            )}
          >
            {data.differentiators.slice(0, 3).map((item, index) => (
              <div key={item} className={cn(MODULE_PANEL, "p-6")}>
                <div
                  className={cn(
                    "font-mono text-[11px] tracking-[0.18em]",
                    TEXT_DIM,
                  )}
                >
                  {`0${index + 1}`}
                </div>
                <p
                  className={cn("mt-4 text-[17px] leading-[1.75]", TEXT_NORMAL)}
                >
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={PAGE_SECTION}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.howItWorksTitle}
            description={templateCopy.howItWorksDescription}
          />

          <div
            className={cn(
              "grid gap-6 border-t py-10 md:grid-cols-2 xl:grid-cols-4 md:py-14",
              SECTION_LINE,
            )}
          >
            {templateCopy.howItWorksSteps.map((item) => (
              <div
                key={item.step}
                className="relative rounded-[26px] border border-black/10 bg-white p-6 shadow-[0_18px_60px_-46px_rgba(15,23,42,0.5)]"
              >
                <div
                  className={cn(
                    "font-mono text-[11px] tracking-[0.18em]",
                    TEXT_MUTED,
                  )}
                >
                  {item.step}
                </div>
                <h3
                  className={cn(
                    "mt-4 text-[1.35rem] font-medium leading-[1.12] tracking-[-0.03em]",
                    TEXT_STRONG,
                  )}
                >
                  {item.title}
                </h3>
                <p
                  className={cn("mt-3 text-[15px] leading-[1.75]", TEXT_MUTED)}
                >
                  {item.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={PAGE_SECTION}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.workflowsTitle}
            description={templateCopy.workflowsDescription}
          />

          <div
            className={cn(
              "grid gap-5 border-t py-8 md:grid-cols-2 md:py-10",
              SECTION_LINE,
            )}
          >
            {data.scenes.map((scene) => (
              <div
                key={scene.modelUrl}
                className={cn(MODULE_PANEL, "p-5 md:p-6")}
              >
                <div className={cn("text-[12px]", TEXT_MUTED)}>
                  {scene.modeLabel}
                </div>
                <h3
                  className={cn(
                    "mt-2 text-[1.55rem] font-medium leading-[1.08] tracking-[-0.035em] md:text-[1.8rem]",
                    TEXT_STRONG,
                  )}
                >
                  {scene.title}
                </h3>
                <p
                  className={cn(
                    "mt-3 text-[15px] leading-[1.7] md:text-[16px]",
                    TEXT_MUTED,
                  )}
                >
                  {scene.description}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {scene.controls.map((control) => (
                    <span
                      key={control}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[12px] font-medium",
                        TEXT_MUTED,
                        FROST_BORDER_SOFT,
                        SURFACE_SOFT,
                      )}
                    >
                      {control}
                    </span>
                  ))}
                </div>

                <div className="mt-6 space-y-2.5">
                  {scene.useCases.map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-[#11FF99]" />
                      <span
                        className={cn(
                          "text-[15px] leading-[1.65]",
                          TEXT_NORMAL,
                        )}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-black/10 pt-5">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={buildModelPageHref(
                        data.slug,
                        scene.sceneId,
                        scene.modelKey,
                        {
                          auto: true,
                          prompt: scene.starterPrompt,
                        },
                      )}
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-full bg-[#111827] px-4 text-[12px] font-semibold tracking-[0] text-white transition hover:bg-[#0b1220]"
                    >
                      {templateCopy.openWithPrompt}
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href={buildCreatorHref(scene.sceneId, scene.modelKey)}
                      className={cn(
                        "inline-flex min-h-[42px] items-center gap-2 rounded-full border px-4 text-[12px] font-semibold tracking-[0] text-[#1f2937] transition hover:bg-black/[0.04]",
                        FROST_BORDER,
                      )}
                    >
                      {templateCopy.openInCreator}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={PAGE_SECTION}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.bestForTitle}
            description={templateCopy.bestForDescription}
          />

          <div
            className={cn(
              "grid gap-6 border-t py-10 md:grid-cols-2 md:py-14",
              SECTION_LINE,
            )}
          >
            {data.scenes
              .flatMap((scene) =>
                scene.useCases.slice(0, 2).map((useCase) => ({
                  key: `${scene.modelUrl}-${useCase}`,
                  title: useCase,
                  copy: scene.description,
                })),
              )
              .slice(0, 4)
              .map((item) => (
                <div key={item.key} className={cn(MODULE_PANEL, "p-6")}>
                  <h3
                    className={cn(
                      "text-[1.4rem] font-medium leading-[1.15] tracking-[-0.03em]",
                      TEXT_STRONG,
                    )}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={cn(
                      "mt-3 text-[15px] leading-[1.75]",
                      TEXT_MUTED,
                    )}
                  >
                    {item.copy}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <section className={PAGE_SECTION}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.galleryTitle}
            description={templateCopy.galleryDescription}
          />

          <div className={cn("border-t py-10 md:py-14", SECTION_LINE)}>
            <div className="mx-auto max-w-4xl text-center">
              <p
                className={cn(
                  "text-[1.45rem] font-medium leading-[1.25] tracking-[-0.03em] md:text-[1.8rem]",
                  TEXT_STRONG,
                )}
              >
                {templateCopy.galleryLead}
              </p>
              <div className="mt-6 grid gap-4 text-left md:grid-cols-3">
                {data.differentiators.slice(0, 3).map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-black/10 bg-white px-4 py-4 shadow-[0_18px_50px_-42px_rgba(15,23,42,0.5)]"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border",
                          FROST_BORDER,
                          SURFACE_SOFT,
                        )}
                      >
                        <Layers3 className="size-3.5 text-[#1f2937]" />
                      </div>
                      <p
                        className={cn("text-[14px] leading-[1.75]", TEXT_MUTED)}
                      >
                        {item}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {data.gallery.slice(0, 4).map((item, index) => (
                <div
                  key={item.title}
                  className={cn(MODULE_PANEL, "group overflow-hidden")}
                >
                  {item.imageUrl ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/[0.04]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "flex aspect-[4/3] items-end bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.015)_100%)] p-5",
                        item.accentClassName,
                      )}
                    >
                      <div className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/85">
                        {templateCopy.sampleLabel}{" "}
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>
                  )}

                  <div className="min-h-[168px] p-5 md:p-6">
                    <div
                      className={cn(
                        "font-mono text-[11px] uppercase tracking-[0.18em]",
                        TEXT_DIM,
                      )}
                    >
                      {templateCopy.sampleLabel}{" "}
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <h3
                      className={cn(
                        "mt-3 text-[1.45rem] font-medium leading-[1.08] tracking-[-0.03em] md:text-[1.65rem]",
                        TEXT_STRONG,
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-3 text-[15px] leading-[1.7]",
                        TEXT_MUTED,
                      )}
                    >
                      {item.caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={cn("border-t", FROST_BORDER_SOFT, PAGE_SECTION)}>
        <div className="container py-6 md:py-8">
          <SectionHeader
            title={templateCopy.faqTitle}
            description={templateCopy.faqDescription}
          />

          <div className={cn("border-t pt-10 md:pt-12", SECTION_LINE)}>
            <div className="mx-auto max-w-4xl">
              <Accordion
                type="single"
                collapsible
                className="overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_18px_60px_-42px_rgba(15,23,42,0.55)]"
              >
                {data.faqs.map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-b border-black/10 px-6 last:border-b-0 md:px-8"
                  >
                    <AccordionTrigger className="py-6 text-[1.15rem] font-medium leading-[1.35] tracking-[-0.02em] text-[#111827] hover:no-underline md:text-[1.3rem]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-6 text-[15px] leading-[1.8] text-[#5f6672] md:pb-8 md:text-[16px]">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
