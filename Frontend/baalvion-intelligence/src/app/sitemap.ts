import type { MetadataRoute } from "next";

const baseUrl = "https://signal.baalvion.com";

const routes = [
  "",
  "/pricing",
  "/docs",
  "/docs/getting-started",
  "/docs/authentication",
  "/docs/mcp-server",
  "/blog",
  "/company/about",
  "/company/contact",
  "/company/careers",
  "/legal/privacy",
  "/legal/terms",
  "/legal/refund-policy",
  "/legal/shipping-policy",
  "/login",
  "/signup",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.6,
  }));
}
