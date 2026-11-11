import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales, defaultLocale } from "@/config/locale";
import { Features } from "@/themes/default/blocks/features";
import { FAQ } from "@/themes/default/blocks/faq";
import { CTA } from "@/themes/default/blocks/cta";
import { envConfigs } from "@/config";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { JsonLd } from "@/shared/components/jsonld";
import { ltx2FastTextToVideoConfig } from "@/shared/blocks/desktop-playground";
import {
  generateSoftwareApplicationSchema,
  generateHowToSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld/index";
import {
  Hero as HeroType,
  Features as FeaturesType,
  FAQ as FAQType,
  CTA as CTAType,
} from "@/shared/types/blocks/landing";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  Video,
  Zap,
  Film,
  Camera,
  Globe,
  Sparkles,
  Briefcase,
  Users,
  ShoppingBag,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

const BASE_URL = envConfigs.app_url;
const CANONICAL_PATH = "/text-to-video/ltx2-fast";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing.ltx-2-fast.ltx2FastPage.metadata");

  const canonicalUrl =
    locale !== defaultLocale
      ? `${BASE_URL}/${locale}${CANONICAL_PATH}`
      : `${BASE_URL}${CANONICAL_PATH}`;

  const title = t("title", {
    defaultValue:
      "LTX-2 Text to Video | Free AI Video Generator Online | 4K Text to Video | Barko Bear",
  });
  const description = t("description", {
    defaultValue:
      "Create stunning 4K videos with LTX-2 text to video AI. Free online LTX-2 text to video generator with synchronized audio. Generate professional videos from text prompts in seconds. No download required.",
  });

  return {
    title,
    description,
    keywords: t("keywords", {
      defaultValue:
        "ltx-2 text to video, ltx-2 text to video generator, ltx-2 text to video AI, ltx-2 text to video online, ltx-2 text to video free, LTX-2 text to video, LTX 2 text to video, text to video ltx-2, AI text to video, 4K text to video, free text to video, text to video generator",
    }),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Barko Bear",
      locale: locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function canonicalizeUrl(url: string) {
  if (url !== `${BASE_URL}/` && url.endsWith("/")) {
    return url.replace(/\/$/, "");
  }
  return url;
}

function getAbsoluteUrl(path: string, locale: string) {
  const localePrefix = locale && locale !== defaultLocale ? `/${locale}` : "";
  const safePath = path.startsWith("/") ? path : `/${path}`;
  return canonicalizeUrl(`${BASE_URL}${localePrefix}${safePath}`);
}

export default async function TextToVideoLtx2FastPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tPage = await getTranslations("landing.ltx-2-fast.ltx2FastPage");
  const tLtx2 = await getTranslations("landing.ltx-2-fast");
  const tHeader = await getTranslations("landing.header");

  // 获取 header 导航菜单项
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  // Hero data
  const heroDescription =
    (tPage.raw("hero.description") as string) ||
    "Transform your text prompts into professional 4K videos with synchronized audio using LTX-2 text to video technology. Our free LTX-2 text to video generator creates stunning videos from text descriptions in seconds. Experience the power of LTX-2 text to video AI with native 4K resolution and up to 50 FPS.";
  const heroData: HeroType = {
    id: "hero",
    title: tPage("hero.title", {
      defaultValue: "LTX-2 Text to Video AI Generator",
    }),
    description: heroDescription,
    buttons: [
      {
        title: tPage("hero.button1", { defaultValue: "Start Creating Free" }),
        url: "#playground",
        variant: "default",
      },
      {
        title: tPage("hero.button2", { defaultValue: "View Pricing" }),
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  // Key Features
  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: tPage("keyFeatures.title", {
      defaultValue: "Why Choose LTX-2 Video Generator?",
    }),
    description: tPage("keyFeatures.description", {
      defaultValue:
        "Experience the next generation of AI video creation with cutting-edge features built for professionals and creators alike.",
    }),
    items: [
      {
        title: tPage("keyFeatures.native4K.title", {
          defaultValue: "Native 4K Resolution",
        }),
        description: tPage("keyFeatures.native4K.description", {
          defaultValue:
            "Generate stunning videos at true 4K (3840×2160) resolution. Perfect for professional content, marketing campaigns, and broadcast-quality productions.",
        }),
        icon: "Film",
      },
      {
        title: tPage("keyFeatures.synchronizedAudio.title", {
          defaultValue: "Synchronized Audio",
        }),
        description: tPage("keyFeatures.synchronizedAudio.description", {
          defaultValue:
            "LTX-2 generates video and audio together in one unified pass. Motion, dialogue, ambience, and music are naturally aligned without manual syncing.",
        }),
        icon: "Zap",
      },
      {
        title: tPage("keyFeatures.lightningFast.title", {
          defaultValue: "Lightning Fast Generation",
        }),
        description: tPage("keyFeatures.lightningFast.description", {
          defaultValue:
            "Generate a 6-second HD video in just 5 seconds of compute time. Up to 50% lower compute cost compared to competing AI video models.",
        }),
        icon: "Sparkles",
      },
      {
        title: tPage("keyFeatures.imageToVideo.title", {
          defaultValue: "Image to Video",
        }),
        description: tPage("keyFeatures.imageToVideo.description", {
          defaultValue:
            "Transform any static image into dynamic video content. Perfect for animating artwork, photos, product shots, and concept designs.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.creativeControl.title", {
          defaultValue: "Precise Creative Control",
        }),
        description: tPage("keyFeatures.creativeControl.description", {
          defaultValue:
            "Multi-keyframe conditioning, 3D camera logic, and LoRA fine-tuning support give you complete control over every aspect of your video.",
        }),
        icon: "Camera",
      },
      {
        title: tPage("keyFeatures.openSource.title", {
          defaultValue: "Open Source Foundation",
        }),
        description: tPage("keyFeatures.openSource.description", {
          defaultValue:
            "Built on Lightricks' open-source LTX 2 model. Full transparency with model weights available on GitHub and Hugging Face for customization.",
        }),
        icon: "Globe",
      },
    ],
  };

  // FAQ
  const faqData: FAQType = {
    id: "faq",
    title: tPage("faq.title", { defaultValue: "Frequently Asked Questions" }),
    description: tPage("faq.description", {
      defaultValue:
        "Everything you need to know about LTX-2 AI Video Generator.",
    }),
    items: [
      {
        question: tPage("faq.q1.question", {
          defaultValue: "What is LTX-2 and how does it work?",
        }),
        answer: tPage("faq.q1.answer", {
          defaultValue:
            "LTX-2 is Lightricks' next-generation open-source AI video foundation model. It uses a DiT (Diffusion-Transformer) hybrid architecture with space-time modeling to generate high-fidelity videos from text prompts or images. The model creates synchronized audio and video in a single pass, eliminating the need for separate audio stitching or manual syncing. LTX-2 supports native 4K resolution at up to 50 FPS with clips up to 20 seconds long.",
        }),
      },
      {
        question: tPage("faq.q2.question", {
          defaultValue: "Is LTX-2 video generator free to use?",
        }),
        answer: tPage("faq.q2.answer", {
          defaultValue:
            "Yes, our LTX-2 video generator offers free access for basic video generation. The underlying LTX 2 model is fully open-source with complete model weights available on GitHub and Hugging Face. For higher resolution (4K), longer durations, and commercial use, premium plans are available with additional features and priority processing.",
        }),
      },
      {
        question: tPage("faq.q3.question", {
          defaultValue: "What resolution and quality can LTX-2 generate?",
        }),
        answer: tPage("faq.q3.answer", {
          defaultValue:
            "LTX-2 supports multiple resolutions including 720p HD, 1080p Full HD, 1440p QHD, and native 4K Ultra HD (3840×2160). The model can generate videos at frame rates up to 50 FPS, delivering smooth cinematic motion. Maximum video duration is 20 seconds of continuous synchronized audio-video generation.",
        }),
      },
      {
        question: tPage("faq.q4.question", {
          defaultValue: "Can I use LTX-2 with ComfyUI locally?",
        }),
        answer: tPage("faq.q4.answer", {
          defaultValue:
            "Yes! LTX-2 has native ComfyUI integration. You can download the model weights from Hugging Face and use them with ComfyUI-LTXVideo nodes for local generation. For optimal performance, NVIDIA recommends 12GB+ VRAM for 720p/1080p and 24GB+ for 4K generation. The model supports NVFP8 quantization for reduced memory usage and faster inference on RTX GPUs.",
        }),
      },
      {
        question: tPage("faq.q5.question", {
          defaultValue: "What GPU and VRAM do I need to run LTX-2 locally?",
        }),
        answer: tPage("faq.q5.answer", {
          defaultValue:
            "Minimum requirements: 12GB VRAM for 720p-1080p at 24-30 FPS. Recommended: 16-24GB VRAM (RTX 4080, RTX 3090) for comfortable 1080p-1440p generation. Ideal: 24GB+ VRAM (RTX 4090, RTX 5090) for native 4K at 50 FPS. NVIDIA has optimized NVFP8 weights that reduce VRAM by 40% and improve performance by 2x on RTX 40/50 series GPUs.",
        }),
      },
      {
        question: tPage("faq.q6.question", {
          defaultValue: "How does LTX-2 compare to other AI video generators?",
        }),
        answer: tPage("faq.q6.answer", {
          defaultValue:
            "LTX-2 is the first open-source model combining synchronized audio-video generation, native 4K resolution, and 50 FPS in one system. Compared to Runway, Pika, and Kling, LTX-2 offers up to 50% lower compute costs and full open-source transparency. It excels in visual fidelity and runs efficiently on consumer GPUs, making professional video creation accessible to independent creators.",
        }),
      },
      {
        question: tPage("faq.q7.question", {
          defaultValue: "Can I train custom LoRA models with LTX-2?",
        }),
        answer: tPage("faq.q7.answer", {
          defaultValue:
            "Yes! LTX-2 supports LoRA fine-tuning for custom styles, motion patterns, and character likeness. Training for motion, style, or likeness can take less than an hour in many settings. The LTX-2 Trainer provides comprehensive documentation for full fine-tuning, LoRA training, and IC-LoRA (Identity-Consistent LoRA) workflows.",
        }),
      },
    ],
  };

  // Final CTA
  const finalCTA: CTAType = {
    id: "final-cta",
    title: tPage("finalCTA.title", {
      defaultValue: "Ready to Create Amazing Videos?",
    }),
    description:
      tPage.raw("finalCTA.description") ||
      "Join thousands of creators using LTX-2 to bring their visions to life.",
    buttons: [
      {
        title: tPage("finalCTA.button", {
          defaultValue: "Start Generating Now — It's Free",
        }),
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const canonicalUrl = getAbsoluteUrl(CANONICAL_PATH, locale);

  // Generate JSON-LD schemas
  const softwareSchema = generateSoftwareApplicationSchema({
    name: "LTX-2 Text to Video Generator",
    description: heroDescription.replace(/<[^>]*>/g, "").substring(0, 200),
    url: CANONICAL_PATH,
    locale,
    category: "MultimediaApplication",
    features: [
      "LTX-2 text to video",
      "4K video generation",
      "Synchronized audio",
      "Text to video AI",
      "Image to video",
      "50 FPS support",
      "20 second videos",
    ],
  });

  const howToSchema = generateHowToSchema({
    name: "How to Use LTX-2 Text to Video",
    description:
      "Create professional videos with LTX-2 text to video AI. Generate 4K videos from text prompts with synchronized audio.",
    steps: [
      {
        name: "Enter Your Prompt",
        text: "Describe the video you want to create. Include details about the scene, action, camera movement, and mood for best results.",
      },
      {
        name: "Choose Settings",
        text: "Select your preferred duration (up to 20 seconds) and enable audio sync.",
      },
      {
        name: "Generate & Download",
        text: "Click generate and watch LTX-2 AI create your video with synchronized audio. Download in high quality for immediate use.",
      },
    ],
    totalTime: "PT60S",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer === "string" ? item.answer : "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Text to Video", url: "/text-to-video" },
      { name: "LTX-2 Text to Video", url: CANONICAL_PATH },
    ],
    locale,
  );

  return (
    <>
      <JsonLd
        data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]}
      />

      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={ltx2FastTextToVideoConfig}
      >
        {/* Key Features */}
        <Features features={keyFeatures} className="py-16 md:py-24" />

        {/* Specs Section */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("specs.title", {
                    defaultValue: "LTX-2 Technical Specifications",
                  })}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  {tPage("specs.description", {
                    defaultValue:
                      "Industry-leading performance metrics that set the standard for AI video generation.",
                  })}
                </p>
                <div className="grid gap-6 md:grid-cols-4 mt-8">
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#00f0ff] via-[#7b61ff] to-[#ff00aa] bg-clip-text text-transparent mb-2">
                      4K
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tPage("specs.maxResolution", {
                        defaultValue: "Maximum Resolution",
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#00f0ff] via-[#7b61ff] to-[#ff00aa] bg-clip-text text-transparent mb-2">
                      50
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tPage("specs.fps", { defaultValue: "FPS Frame Rate" })}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#00f0ff] via-[#7b61ff] to-[#ff00aa] bg-clip-text text-transparent mb-2">
                      20s
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tPage("specs.maxLength", {
                        defaultValue: "Max Video Length",
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-card p-6 text-center">
                    <div className="text-4xl font-bold bg-gradient-to-r from-[#00f0ff] via-[#7b61ff] to-[#ff00aa] bg-clip-text text-transparent mb-2">
                      50%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {tPage("specs.lowerCost", {
                        defaultValue: "Lower Compute Cost",
                      })}
                    </div>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("howItWorks.title", {
                    defaultValue: "How to Generate Videos with LTX-2",
                  })}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  {tPage("howItWorks.description", {
                    defaultValue:
                      "Create professional AI videos in three simple steps. No technical knowledge required.",
                  })}
                </p>
                <div className="grid gap-6 md:grid-cols-3 mt-8">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      1
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step1.title", {
                        defaultValue: "Enter Your Prompt",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step1.description", {
                        defaultValue:
                          "Describe the video you want to create. Include details about the scene, action, camera movement, and mood for best results.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      2
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step2.title", {
                        defaultValue: "Choose Settings",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step2.description", {
                        defaultValue:
                          "Select your preferred duration (up to 20 seconds) and enable audio sync.",
                      })}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary">
                      3
                    </div>
                    <h3 className="font-semibold mb-2">
                      {tPage("howItWorks.step3.title", {
                        defaultValue: "Generate & Download",
                      })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tPage("howItWorks.step3.description", {
                        defaultValue:
                          "Click generate and watch LTX-2 AI create your video with synchronized audio. Download in high quality for immediate use.",
                      })}
                    </p>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-16 md:py-24 bg-muted/30">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="text-3xl font-semibold tracking-tight text-center mb-6">
                  {tPage("useCases.title", {
                    defaultValue: "Perfect For Every Creator",
                  })}
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  {tPage("useCases.description", {
                    defaultValue:
                      "LTX-2 powers diverse creative workflows across industries.",
                  })}
                </p>
                <div className="grid gap-4 md:grid-cols-4 mt-8">
                  {[
                    {
                      icon: "📱",
                      text: tPage("useCases.socialMedia", {
                        defaultValue: "Social Media Content",
                      }),
                    },
                    {
                      icon: "🎥",
                      text: tPage("useCases.filmTV", {
                        defaultValue: "Film & TV Production",
                      }),
                    },
                    {
                      icon: "📢",
                      text: tPage("useCases.marketing", {
                        defaultValue: "Marketing & Advertising",
                      }),
                    },
                    {
                      icon: "🎮",
                      text: tPage("useCases.gameDev", {
                        defaultValue: "Game Development",
                      }),
                    },
                    {
                      icon: "📚",
                      text: tPage("useCases.educational", {
                        defaultValue: "Educational Content",
                      }),
                    },
                    {
                      icon: "🎨",
                      text: tPage("useCases.artAnimation", {
                        defaultValue: "Art & Animation",
                      }),
                    },
                    {
                      icon: "🏢",
                      text: tPage("useCases.corporate", {
                        defaultValue: "Corporate Videos",
                      }),
                    },
                    {
                      icon: "🎵",
                      text: tPage("useCases.musicVideos", {
                        defaultValue: "Music Videos",
                      }),
                    },
                  ].map((useCase, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border bg-card p-4 flex items-center gap-3 hover:border-primary/50 transition-colors"
                    >
                      <span className="text-2xl">{useCase.icon}</span>
                      <span className="font-medium text-sm">
                        {useCase.text}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <FAQ faq={faqData} className="py-16 md:py-24" />

        {/* Final CTA */}
        <CTA cta={finalCTA} className="py-16 md:py-24 bg-muted/30" />
      </AiMediaPageLayout>
    </>
  );
}
