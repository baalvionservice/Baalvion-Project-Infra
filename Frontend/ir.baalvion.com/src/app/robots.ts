import { AppConfig } from "@/config";
import { MetadataRoute } from "next";
import { GATED_PREFIXES, INVITE_GATED_PREFIXES, INVITE_OPEN_PATHS } from "@/lib/seo-routes";

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
    // Invitation-only under Companies Act s.42 — see lib/invite-gate.ts. The founder-side routes
    // below are allowed back explicitly; robots.txt resolves by longest match, so they win.
    ...INVITE_GATED_PREFIXES.flatMap((p) => [p, `${p}/`]),
    "/private/",
    "/_next/",
    "/static/",
    "*.json",
  ];

  // /onboarding is both auth-gated and invitation-gated, so it lands in the list twice. Emit each
  // path once — a duplicated directive is not wrong, just noise in a file people read.
  const uniqueDisallow = [...new Set(disallow)];

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/why-invest",
          ...INVITE_OPEN_PATHS,
          "/invest/request-access",
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
        disallow: uniqueDisallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
