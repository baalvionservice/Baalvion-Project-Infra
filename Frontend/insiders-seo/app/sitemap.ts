import type { MetadataRoute } from "next";
import { getInvestors, getFounders, SITE_URL, REVALIDATE } from "@/lib/api";
import { sectorsFrom } from "@/lib/seo";

export const revalidate = REVALIDATE;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [investors, founders] = await Promise.all([getInvestors(), getFounders()]);
  const sectors = sectorsFrom(investors);
  const now = new Date();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1.0, lastModified: now },
    { url: `${SITE_URL}/investors`, changeFrequency: "daily", priority: 0.9, lastModified: now },
    { url: `${SITE_URL}/founders`, changeFrequency: "daily", priority: 0.9, lastModified: now },
  ];

  const sectorUrls: MetadataRoute.Sitemap = sectors.map((s) => ({
    url: `${SITE_URL}/investors/sector/${s.slug}`, changeFrequency: "weekly", priority: 0.7, lastModified: now,
  }));

  const investorUrls: MetadataRoute.Sitemap = investors.map((i) => ({
    url: `${SITE_URL}/investors/${i.slug}`, changeFrequency: "weekly", priority: 0.8,
    lastModified: i.updated_at ? new Date(i.updated_at) : now,
  }));

  const founderUrls: MetadataRoute.Sitemap = founders.map((f) => ({
    url: `${SITE_URL}/founders/${f.slug}`, changeFrequency: "weekly", priority: 0.8,
    lastModified: f.updated_at ? new Date(f.updated_at) : now,
  }));

  return [...staticUrls, ...sectorUrls, ...investorUrls, ...founderUrls];
}
