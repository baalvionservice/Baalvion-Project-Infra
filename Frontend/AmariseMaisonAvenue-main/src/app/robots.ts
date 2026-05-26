import { MetadataRoute } from "next";

/**
 * Institutional Robots Exclusion Protocol
 * Optimizes crawl budget for high-value registry paths.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/checkout/",
          "/account/",
          "/inquiry/",
          "/private-order/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: "https://www.amarisemaisonavenue.com//sitemap.xml",
  };
}
