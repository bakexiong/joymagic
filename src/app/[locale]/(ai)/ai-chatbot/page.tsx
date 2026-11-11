import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { Hero } from "@/themes/default/blocks/hero";
import { JsonLd } from "@/shared/components/jsonld";
import {
  generateSoftwareApplicationSchema,
  generateBreadcrumbSchema,
} from "@/shared/lib/jsonld";
import { getMetadata } from "@/shared/lib/seo";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export const generateMetadata = getMetadata({
  title: "AI Chatbot Online for Creative Planning and Content Ideas | Barko Bear",
  description:
    "Use Barko Bear AI Chatbot to brainstorm prompts, plan creative assets, draft content ideas, and support image, video, and audio workflows.",
  keywords:
    "AI chatbot, creative AI assistant, prompt assistant, content idea generator, AI planning chatbot",
  canonicalUrl: "/ai-chatbot",
});

export default async function AiChatbotPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("landing");
  const tt = await getTranslations("demo.ai-chatbot");

  const softwareSchema = generateSoftwareApplicationSchema({
    name: "Barko Bear AI Chatbot",
    description: tt.raw("description") as string,
    url: "/ai-chatbot",
    locale,
    category: "BusinessApplication",
    features: [
      "AI Chat",
      "Natural Language Processing",
      "Intelligent Responses",
    ],
  });

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "AI Chatbot", url: "/ai-chatbot" },
    ],
    locale,
  );

  return (
    <>
      <JsonLd data={[softwareSchema, breadcrumbSchema]} />
      <Hero
        hero={{
          title: tt.raw("title"),
          description: tt.raw("description"),
        }}
      />
    </>
  );
}
