import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { videoFaceSwapConfig } from "@/shared/blocks/desktop-playground";
import { JsonLd } from "@/shared/components/jsonld";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  generateBreadcrumbSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";
import type { Hero as HeroType } from "@/shared/types/blocks/landing";
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Lock,
  Scale,
  Shield,
  Sparkles,
  Upload,
  Users,
  Video,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title:
    "AI Video Face Swap Online for Clips, Memes, and Social Content | Barko Bear",
  description:
    "Swap faces in videos online with Barko Bear. Create AI face swap clips, meme videos, cosplay scenes, and social-ready edits from simple uploads.",
  keywords:
    "AI video face swap, face swap video generator, online face swap, AI meme video maker, video face editor",
  canonicalUrl: "/video-face-swap",
});

export default async function VideoFaceSwapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tPage = await getTranslations(
    "landing.video-face-swap-page.videoFaceSwapPage",
  );
  const tHeader = await getTranslations("landing.header");

  const text = (key: string) => tPage.raw(key) as string;
  const html = (key: string) => ({ __html: text(key) });

  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];
  const heroData = t.raw("faceSwap") as HeroType;

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Barko Bear Video Face Swap",
    description:
      (heroData.description as string) || "AI-powered video face swap tool",
    url: "/video-face-swap",
    locale,
    category: "MultimediaApplication",
    features: [
      "Face Detection",
      "Face Tracking",
      "Face Swap",
      "Video Processing",
    ],
  });

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Video Face Swap", url: "/video-face-swap" },
    ],
    locale,
  );

  const whatIsCapabilities = [
    text("whatIs.detect"),
    text("whatIs.track"),
    text("whatIs.swap"),
    text("whatIs.keep"),
  ];

  const whatIsUseCases = [
    text("whatIs.movieScenes"),
    text("whatIs.memeStars"),
    text("whatIs.cosplay"),
    text("whatIs.socialMedia"),
  ];

  const workflow = [
    {
      icon: Upload,
      title: text("howTo.step1.title"),
      description: text("howTo.step1.description"),
      bullets: [
        text("howTo.step1.supportFormats"),
        text("howTo.step1.clearFaces"),
        text("howTo.step1.quality"),
      ],
      footer: "",
    },
    {
      icon: Video,
      title: text("howTo.step2.title"),
      description: text("howTo.step2.description"),
      bullets: [
        text("howTo.step2.secondVideo"),
        text("howTo.step2.detectBoth"),
        text("howTo.step2.chooseFace"),
      ],
      footer: text("howTo.step2.singleImage"),
    },
    {
      icon: ImageIcon,
      title: text("howTo.step3.title"),
      description: text("howTo.step3.description"),
      bullets: [
        text("howTo.step3.bestResults"),
        text("howTo.step3.clearPhoto"),
        text("howTo.step3.wellLit"),
        text("howTo.step3.avoidFilters"),
      ],
      footer: text("howTo.step3.autoAlign"),
    },
    {
      icon: Sparkles,
      title: text("howTo.step4.title"),
      description: text("howTo.step4.description"),
      bullets: [
        text("howTo.step4.trim"),
        text("howTo.step4.focus"),
        text("howTo.step4.improve"),
      ],
      footer: text("howTo.step4.generate"),
    },
  ];

  const featureCards = [
    {
      title: text("features.speed.title"),
      description: html("features.speed.description"),
      bullets: [
        html("features.speed.faster"),
        html("features.speed.complex"),
        html("features.speed.sixFaces"),
        { __html: text("features.speed.quick") },
      ],
      footer: html("features.speed.watermarkFree"),
    },
    {
      title: text("features.templates.title"),
      description: html("features.templates.description"),
      bullets: [
        { __html: text("features.templates.memeFormats") },
        { __html: text("features.templates.movieScenes") },
        { __html: text("features.templates.reaction") },
        { __html: text("features.templates.cosplay") },
        { __html: text("features.templates.shortForm") },
      ],
      footer: { __html: text("features.templates.simple") },
    },
    {
      title: text("features.viral.title"),
      description: html("features.viral.description"),
      bullets: [
        { __html: text("features.viral.movieMoment") },
        { __html: text("features.viral.memes") },
        { __html: text("features.viral.team") },
        { __html: text("features.viral.standOut") },
      ],
      footer: html("features.viral.easy"),
    },
  ];

  const faqCards = [
    {
      question: text("faq.q1.question"),
      content: [html("faq.q1.answer1"), { __html: text("faq.q1.answer2") }],
      bullets: [],
    },
    {
      question: text("faq.q2.question"),
      content: [
        { __html: text("faq.q2.answer1") },
        { __html: text("faq.q2.answer2") },
      ],
      bullets: [
        { __html: text("faq.q2.simple") },
        { __html: text("faq.q2.aiHandles") },
      ],
    },
    {
      question: text("faq.q3.question"),
      content: [
        { __html: text("faq.q3.answer1") },
        { __html: text("faq.q3.answer2") },
      ],
      bullets: [{ __html: text("faq.q3.mp4") }],
    },
    {
      question: text("faq.q4.question"),
      content: [
        html("faq.q4.answer1"),
        { __html: text("faq.q4.answer2") },
        { __html: text("faq.q4.answer3") },
      ],
      bullets: [
        html("faq.q4.visible"),
        html("faq.q4.invisible"),
        html("faq.q4.purpose"),
      ],
    },
    {
      question: text("faq.q5.question"),
      content: [
        { __html: text("faq.q5.answer1") },
        { __html: text("faq.q5.privacyRules") },
        { __html: text("faq.q5.responsible") },
      ],
      bullets: [
        { __html: text("faq.q5.secure") },
        html("faq.q5.only"),
        html("faq.q5.notTrain"),
        { __html: text("faq.q5.delete") },
        html("faq.q5.neverUpload1"),
        html("faq.q5.neverUpload2"),
        html("faq.q5.neverUpload3"),
        { __html: text("faq.q5.unauthorized") },
      ],
    },
    {
      question: text("faq.q6.question"),
      content: [html("faq.q6.answer1")],
      bullets: [
        { __html: text("faq.q6.swapOne") },
        { __html: text("faq.q6.mapDifferent") },
        { __html: text("faq.q6.great") },
      ],
    },
    {
      question: text("faq.q7.question"),
      content: [html("faq.q7.answer1")],
      bullets: [
        { __html: text("faq.q7.audioStays") },
        { __html: text("faq.q7.editLater") },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />

      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={videoFaceSwapConfig}
      >
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
              <ScrollAnimation>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_22px_52px_rgba(0,0,0,0.22)] backdrop-blur-sm">
                  <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                    Overview
                  </p>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                    {text("whatIs.title")}
                  </h2>
                  <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground md:text-base">
                    <p dangerouslySetInnerHTML={html("whatIs.description")} />
                    <p>{text("whatIs.uses")}</p>
                    <p>{text("whatIs.canDo")}</p>
                    <p>{text("whatIs.cloud")}</p>
                  </div>
                </div>
              </ScrollAnimation>

              <div className="grid gap-5">
                <ScrollAnimation>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-3">
                      <Users className="size-5 text-white/75" />
                      <h3 className="font-semibold">Core pipeline</h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {whatIsCapabilities.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollAnimation>

                <ScrollAnimation>
                  <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-5 text-white/75" />
                      <h3 className="font-semibold">Popular outcomes</h3>
                    </div>
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {whatIsUseCases.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </ScrollAnimation>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                  Workflow
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  {text("howTo.title")}
                </h2>
                <p
                  className="mt-4 text-base leading-8 text-muted-foreground md:text-lg"
                  dangerouslySetInnerHTML={html("howTo.description")}
                />
              </ScrollAnimation>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {workflow.map((step, index) => {
                const Icon = step.icon;

                return (
                  <ScrollAnimation key={step.title}>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                      <div className="flex items-center gap-4">
                        <span className="flex size-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold text-white/88">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-3">
                          <Icon className="size-5 text-white/75" />
                          <h3 className="text-lg font-semibold">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      <p
                        className="mt-4 text-sm leading-7 text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: step.description }}
                      />
                      <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                        {step.bullets.map((item) => (
                          <li key={item} className="flex gap-3">
                            <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {step.footer ? (
                        <p
                          className="mt-4 text-sm leading-7 text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: step.footer }}
                        />
                      ) : null}
                    </div>
                  </ScrollAnimation>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                  Capabilities
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  {text("features.title")}
                </h2>
              </ScrollAnimation>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {featureCards.map((card) => (
                <ScrollAnimation key={card.title}>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold">{card.title}</h3>
                    <div
                      className="mt-4 text-sm leading-7 text-muted-foreground"
                      dangerouslySetInnerHTML={card.description}
                    />
                    <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                      {card.bullets.map((item, index) => (
                        <li
                          key={`${card.title}-${index}`}
                          className="flex gap-3"
                        >
                          <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                          <span dangerouslySetInnerHTML={item} />
                        </li>
                      ))}
                    </ul>
                    <div
                      className="mt-4 text-sm leading-7 text-muted-foreground"
                      dangerouslySetInnerHTML={card.footer}
                    />
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                  Guardrails
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  {text("legal.title")}
                </h2>
                <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
                  {text("legal.intro")}
                </p>
              </ScrollAnimation>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <Users className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.whoCanSwap.title")}
                    </h3>
                  </div>
                  <p className="mt-4 font-medium text-white/90">
                    {text("legal.whoCanSwap.mayUse")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      text("legal.whoCanSwap.ownFace"),
                      text("legal.whoCanSwap.consent"),
                      text("legal.whoCanSwap.fictional"),
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 font-medium text-white/90">
                    {text("legal.whoCanSwap.mayNotUse")}
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      text("legal.whoCanSwap.noPermission"),
                      text("legal.whoCanSwap.celebrity"),
                      text("legal.whoCanSwap.minors"),
                      text("legal.whoCanSwap.deceive"),
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.prohibited.title")}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {text("legal.prohibited.description")}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      html("legal.prohibited.impersonation"),
                      html("legal.prohibited.nonConsensual"),
                      html("legal.prohibited.harassment"),
                      html("legal.prohibited.copyright"),
                      html("legal.prohibited.political"),
                      html("legal.prohibited.identityTheft"),
                    ].map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span dangerouslySetInnerHTML={item} />
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <Shield className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.disclosure.title")}
                    </h3>
                  </div>
                  <p className="mt-4 font-medium text-white/90">
                    {text("legal.disclosure.important")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {text("legal.disclosure.description")}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      text("legal.disclosure.disclose"),
                      text("legal.disclosure.jurisdictions"),
                      text("legal.disclosure.watermarks"),
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.responsibilities.title")}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {text("legal.responsibilities.description")}
                  </p>
                  <ol className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      html("legal.responsibilities.verify"),
                      html("legal.responsibilities.comply"),
                      html("legal.responsibilities.respect"),
                      html("legal.responsibilities.ethical"),
                    ].map((item, index) => (
                      <li key={index} className="flex gap-3">
                        <span className="text-white/55">{index + 1}.</span>
                        <span dangerouslySetInnerHTML={item} />
                      </li>
                    ))}
                  </ol>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <Lock className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.enforcement.title")}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {text("legal.enforcement.description")}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      text("legal.enforcement.moderation"),
                      text("legal.enforcement.reporting"),
                      text("legal.enforcement.suspension"),
                      text("legal.enforcement.cooperation"),
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 font-medium text-white/90">
                    {text("legal.enforcement.violation")}
                  </p>
                </div>
              </ScrollAnimation>

              <ScrollAnimation>
                <div className="rounded-[24px] border border-white/10 bg-black/20 p-6">
                  <div className="flex items-center gap-3">
                    <Scale className="size-5 text-white/75" />
                    <h3 className="font-semibold">
                      {text("legal.compliance.title")}
                    </h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {text("legal.compliance.description")}
                  </p>
                  <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                    {[
                      text("legal.compliance.china"),
                      text("legal.compliance.eu"),
                      text("legal.compliance.us"),
                    ].map((item) => (
                      <li key={item} className="flex gap-3">
                        <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {text("legal.compliance.consult")}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <ScrollAnimation>
                <p className="text-sm uppercase tracking-[0.28em] text-white/45">
                  FAQ
                </p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  {text("faq.title")}
                </h2>
              </ScrollAnimation>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {faqCards.map((item) => (
                <ScrollAnimation key={item.question}>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                    <h3 className="text-lg font-semibold">{item.question}</h3>
                    <div className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                      {item.content.map((paragraph, index) => (
                        <p
                          key={`${item.question}-p-${index}`}
                          dangerouslySetInnerHTML={paragraph}
                        />
                      ))}
                    </div>
                    {item.bullets.length ? (
                      <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">
                        {item.bullets.map((bullet, index) => (
                          <li
                            key={`${item.question}-b-${index}`}
                            className="flex gap-3"
                          >
                            <span className="mt-2 size-1.5 rounded-full bg-white/45" />
                            <span dangerouslySetInnerHTML={bullet} />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </ScrollAnimation>
              ))}
            </div>
          </div>
        </section>
      </AiMediaPageLayout>
    </>
  );
}
