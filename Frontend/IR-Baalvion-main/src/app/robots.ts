import { AppConfig } from "@/config";
import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = AppConfig.baseUrl;

  // Crawlers should index the public marketing + IR surfaces (home, the
  // investor pages, governance, news, resources, FAQ) and stay out of
  // auth-gated investor-portal routes (which only render a login wall to a
  // crawler) and all admin/api/internal paths.
  const disallow = [
    "/admin/",
    "/api/",
    "/private/",
    "/_next/",
    "/static/",
    "/dashboard",
    "/capital-ops",
    "/strategic-operator",
    "/data-room",
    "/performance",
    "/onboarding",
    "/phase2/",
    "/phase3/",
    "/governance/my-voting",
    "*.json",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/why-invest",
          "/investment-thesis",
          "/market-opportunity",
          "/use-of-proceeds",
          "/financials",
          "/company/",
          "/faq",
          "/governance/",
          "/news-and-events/",
          "/resources/",
        ],
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
