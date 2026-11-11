import type { Metadata } from "next";

import { redirect } from "@/core/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function ToolAliasRoutePage({
  params,
}: {
  params: Promise<{ locale: string; tool: string[] }>;
}) {
  const { locale, tool } = await params;
  const toolPath = Array.isArray(tool) ? tool.join("/") : tool;

  redirect({
    href: `/tools/${toolPath}`,
    locale,
  });
}
