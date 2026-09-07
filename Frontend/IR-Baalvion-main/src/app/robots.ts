import { AppConfig } from "@/config";
import { MetadataRoute } from "next";
import { GATED_PREFIXES } from "@/lib/seo-routes";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = AppConfig.baseUrl;

  // Crawlers should index the public marketing + IR surfaces (home, the
  // investor pages, governance, news, resources, FAQ) and stay out of
  // auth-gated investor-portal routes (which only render a login wall to a
  // crawler) and all admin/api/internal paths.
  // Sourced from lib/seo-routes.ts, the same list sitemap.ts filters against, so robots and the
  // sitemap cannot drift into contradicting each other again.
  const disallow = [
    // Both forms on purpose: "Disallow: /dashboard/" does NOT match "/dashboard" itself, so the
    // bare path stayed crawlable. Emit the exact path and the subtree.
    ...GATED_PREFIXES.flatMap((p) => [p, `${p}/`]),
    "/private/",
    "/_next/",
    "/static/",
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
