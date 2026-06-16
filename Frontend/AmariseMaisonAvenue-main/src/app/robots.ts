import { MetadataRoute } from "next";

/**
 * Institutional Robots Exclusion Protocol
 * Optimizes crawl budget for high-value registry paths.
 */
export default function robots(): MetadataRoute.Robots {
  // Private surfaces live under a market prefix (e.g. /us/account, /uk/checkout),
  // so each pattern is anchored with a wildcard market segment AND a bare form to
  // catch any non-prefixed hit. Path-segment globbing keeps crawl budget on catalog.
  const privatePaths = [
    "/admin/",
    "/*/account/",
    "/*/checkout/",
    "/*/cart/",
    "/*/inquiry/",
    "/*/private-order/",
    "/account/",
    "/checkout/",
    "/inquiry/",
    "/private-order/",
  ];
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: "https://www.amarisemaisonavenue.com/sitemap.xml",
  };
}
