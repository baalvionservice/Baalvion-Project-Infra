import { MetadataRoute } from "next";
import { CITIES, COUNTRIES } from "@/lib/mock-data";
import { getProducts, getCategories } from "@/lib/catalog";
import { getBuyingGuides, getEditorials } from "@/lib/cms";
import { sitemapAlternates } from "@/lib/seo";

function toDate(value: string | undefined): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Institutional Sitemap Generator
 * Automates discovery for thousands of artifacts across 5 jurisdictions.
 * Enhanced with Multi-Language Hreflang logic for SEO authority.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.amarisemaisonavenue.com";
  const countryCodes = Object.keys(COUNTRIES);

  // Live catalog from commerce-service + live editorial content from the central CMS
  // (was mock PRODUCTS/CATEGORIES/BUYING_GUIDES/EDITOR_INITIAL — sitemap now matches
  // what the journal/buying-guide pages actually render).
  const [{ items: products }, categories, buyingGuides, editorials] = await Promise.all([
    getProducts({ limit: 200 }),
    getCategories(),
    getBuyingGuides(),
    getEditorials(),
  ]);

  const routes: MetadataRoute.Sitemap = [];

  // Key public, indexable static surfaces (private paths are intentionally excluded).
  const STATIC_SUBPATHS = [
    "/about",
    "/collections",
    "/journal",
    "/contact",
  ];

  // 1. Core Platform Pages
  countryCodes.forEach((code) => {
    routes.push({
      url: `${baseUrl}/${code}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: sitemapAlternates(""),
    });

    // 1b. Static editorial/commerce landing pages
    STATIC_SUBPATHS.forEach((subPath) => {
      routes.push({
        url: `${baseUrl}/${code}${subPath}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
        alternates: sitemapAlternates(subPath),
      });
    });

    // 2. High-Authority City Pages
    CITIES.forEach((city) => {
      routes.push({
        url: `${baseUrl}/${code}/city/${city.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
        alternates: sitemapAlternates(`/city/${city.id}`),
      });
    });

    // 3. Programmatic Category Nodes
    categories.forEach((cat) => {
      routes.push({
        url: `${baseUrl}/${code}/category/${cat.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
        alternates: sitemapAlternates(`/category/${cat.id}`),
      });
    });

    // 4. Curatorial Intelligence (Guides) — live from CMS
    buyingGuides.forEach((guide) => {
      routes.push({
        url: `${baseUrl}/${code}/buying-guide/${guide.id}`,
        lastModified: toDate(guide.date),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // 5. Editorial Archives (The Journal) — live from CMS
    editorials.forEach((ed) => {
      routes.push({
        url: `${baseUrl}/${code}/journal/${ed.id}`,
        lastModified: toDate(ed.date),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    // 6. Artifact Registry (Individual Products) — live catalog
    products.forEach((prod) => {
      routes.push({
        url: `${baseUrl}/${code}/product/${prod.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.5,
        alternates: sitemapAlternates(`/product/${prod.id}`),
      });
    });
  });

  return routes;
}
