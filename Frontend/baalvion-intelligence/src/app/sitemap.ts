import type { MetadataRoute } from "next";

const baseUrl = "https://signal.baalvion.com";

const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1.0, changeFrequency: "daily" },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/docs", priority: 0.8, changeFrequency: "weekly" },
  { path: "/docs/getting-started", priority: 0.8, changeFrequency: "weekly" },
  { path: "/docs/authentication", priority: 0.7, changeFrequency: "weekly" },
  { path: "/docs/mcp-server", priority: 0.7, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.6, changeFrequency: "daily" },
  { path: "/company/about", priority: 0.5, changeFrequency: "monthly" },
  { path: "/company/contact", priority: 0.4, changeFrequency: "monthly" },
  { path: "/company/careers", priority: 0.4, changeFrequency: "weekly" },
  { path: "/signup", priority: 0.6, changeFrequency: "monthly" },
  { path: "/login", priority: 0.3, changeFrequency: "yearly" },
  { path: "/legal/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/refund-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/legal/shipping-policy", priority: 0.2, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
