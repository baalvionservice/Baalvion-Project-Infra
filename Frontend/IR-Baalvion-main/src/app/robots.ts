import { AppConfig } from "@/config";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = AppConfig.baseUrl;

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/capital-ops",
          "/dashboard",
          "/data-room",
          "/performance",
          "/onboarding",
          "/governance/",
          "/news-and-events/",
          "/resources/",
          "/phase2/",
          "/phase3/",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/_next/",
          "/static/",
          "*.json",
          "*.xml",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/capital-ops",
          "/dashboard",
          "/data-room",
          "/performance",
          "/governance/",
          "/news-and-events/",
          "/resources/",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/onboarding",
          "/phase2/",
          "/phase3/",
        ],
      },
      {
        userAgent: "Bingbot",
        allow: [
          "/",
          "/capital-ops",
          "/dashboard",
          "/data-room",
          "/performance",
          "/governance/",
          "/news-and-events/",
          "/resources/",
        ],
        disallow: [
          "/admin/",
          "/api/",
          "/private/",
          "/onboarding",
          "/phase2/",
          "/phase3/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
