import type { MetadataRoute } from "next";

import { envConfigs } from "@/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = envConfigs.app_url;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/*?*q=",
        "/privacy-policy",
        "/*/privacy-policy",
        "/terms-of-service",
        "/*/terms-of-service",
        "/settings/",
        "/activity/",
        "/admin/",
        "/checkout/",
        "/create/canvas/",
        "/creator",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
