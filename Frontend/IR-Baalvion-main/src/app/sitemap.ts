import { AppConfig } from "@/config";
import { MetadataRoute } from "next";
// The four services previously imported here (page/board-materials/navigation/content) are all
// marked 'use client'. A server-rendered sitemap cannot call them: in a production build they
// resolve to client references and every call threw "getAllPages is not a function", which the
// try/catch below swallowed. The dynamic branch has therefore NEVER contributed a URL in
// production — CMS-authored pages were silently absent from the sitemap. lib/cms.ts is the
// server-side reader for the same content.
import { cmsListPages } from "@/lib/cms";
import { IR_PAGES } from "@/lib/ir-pages";
import { isGatedPath } from "@/lib/seo-routes";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = AppConfig.baseUrl;
  const currentDate = new Date();

  // PUBLIC routes only.
  //
  // A sitemap is a request to index. Listing a page that robots.txt disallows asks a crawler to do
  // two contradictory things, and it was doing exactly that for 11 gated routes — /dashboard,
  // /capital-ops, /onboarding, /governance/my-voting and the phase2/phase3 portals — four of which
  // (/data-room, /performance, /phase2, /phase3) are not even routes in this app.
  //
  // GATED_PREFIXES below is the same list robots.ts blocks, exported from one place so the two
  // cannot drift apart again. Anything matching it is filtered out at the end, whatever adds it.
  const staticRoutes = [
    { url: `${baseUrl}`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${baseUrl}/faq`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  // The marketplace — the two-sided surface investors and founders arrive on. Both sides need to
  // be findable: an investor searching for opportunities, and a founder searching for somewhere
  // to raise.
  const marketplaceRoutes = [
    { url: `${baseUrl}/invest`, lastModified: currentDate, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${baseUrl}/invest/list-your-business`, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 0.9 },
  ];

  // Governance section routes
  const governanceRoutes = [
    { url: `${baseUrl}/governance`, lastModified: currentDate, changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${baseUrl}/governance/overview`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/governance/board-of-directors`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/governance/committee-composition`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/governance/leadership`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
    { url: `${baseUrl}/governance/framework`, lastModified: currentDate, changeFrequency: "monthly" as const, priority: 0.7 },
  ];

  // News and Events — every published surface, not just the four that were listed.
  const newsEventsRoutes = [
    "", "/news", "/press-releases", "/events", "/investor-day", "/webcast",
    "/filings", "/financial-reports", "/documents", "/stock",
  ].map((seg) => ({
    url: `${baseUrl}/news-and-events${seg}`,
    lastModified: currentDate,
    changeFrequency: (seg === "" || seg === "/news" ? "daily" : "weekly") as "daily" | "weekly",
    priority: seg === "" || seg === "/news" ? 0.8 : 0.7,
  }));

  // Canonical institutional IR marketing pages (why-invest, thesis, market,
  // use-of-proceeds, story, financials, governance framework, FAQ, resources).
  // Sourced from the single source of truth in src/lib/ir-pages.ts so the
  // sitemap stays in sync with what is rendered + seeded into the CMS, and
  // these high-value pages are listed even if the dynamic CMS fetch fails.
  const irMarketingRoutes = IR_PAGES.map((page) => ({
    url: `${baseUrl}${page.slug}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: page.slug === "/why-invest" ? 0.9 : 0.8,
  }));

  // Resources section routes
  const resourcesRoutes = [
    {
      url: `${baseUrl}/resources`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/resources/contact-ir`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/resources/email-alerts`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ];

  // Dynamic content from services
  // CMS-authored pages, read server-side. A failure here must not take the whole sitemap down —
  // the static routes are the ones that matter most — but it is logged rather than swallowed.
  let dynamicRoutes: MetadataRoute.Sitemap = [];
  try {
    const pages = await cmsListPages();
    dynamicRoutes = pages
      .filter((page) => page?.slug && page.slug !== "/")
      .map((page) => ({
        url: `${baseUrl}${page.slug.startsWith("/") ? page.slug : `/${page.slug}`}`,
        lastModified: page.updatedAt ? new Date(page.updatedAt) : currentDate,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch (err) {
    console.error("[sitemap] CMS pages unavailable — static routes only:", err instanceof Error ? err.message : err);
  }

  // Combine all routes and remove duplicates
  const allRoutes = [
    ...staticRoutes,
    ...irMarketingRoutes,
    ...governanceRoutes,
    ...newsEventsRoutes,
    ...marketplaceRoutes,
    ...resourcesRoutes,
    ...dynamicRoutes,
  ];

  // Final guard: whatever any branch above contributed — including the dynamic CMS routes — a
  // gated path never reaches the sitemap. Deduped so each URL appears exactly once.
  const uniqueRoutes = allRoutes.filter(
    (route, index, self) =>
      index === self.findIndex((r) => r.url === route.url) &&
      !isGatedPath(route.url.replace(baseUrl, "") || "/")
  );

  return uniqueRoutes.sort((a, b) => (b.priority || 0) - (a.priority || 0));
}
