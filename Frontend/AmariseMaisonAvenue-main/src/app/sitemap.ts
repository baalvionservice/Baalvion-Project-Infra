import { MetadataRoute } from "next";
import {
  PRODUCTS,
  CATEGORIES,
  CITIES,
  BUYING_GUIDES,
  EDITOR_INITIAL,
  COUNTRIES,
} from "@/lib/mock-data";

/**
 * Institutional Sitemap Generator
 * Automates discovery for thousands of artifacts across 5 jurisdictions.
 * Enhanced with Multi-Language Hreflang logic for SEO authority.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.amarisemaisonavenue.com/";
  const countryCodes = Object.keys(COUNTRIES);

  const routes: MetadataRoute.Sitemap = [];

  // 1. Core Platform Pages
  countryCodes.forEach((code) => {
    routes.push({
      url: `${baseUrl}/${code}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    });

    // 2. High-Authority City Pages
    CITIES.forEach((city) => {
      routes.push({
        url: `${baseUrl}/${code}/city/${city.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    });

    // 3. Programmatic Category Nodes
    CATEGORIES.forEach((cat) => {
      routes.push({
        url: `${baseUrl}/${code}/category/${cat.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    });

    // 4. Curatorial Intelligence (Guides)
    BUYING_GUIDES.filter((g) => g.country === code).forEach((guide) => {
      routes.push({
        url: `${baseUrl}/${code}/buying-guide/${guide.id}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      });
    });

    // 5. Editorial Archives (The Journal)
    EDITOR_INITIAL.filter((ed) => ed.country === code).forEach((ed) => {
      routes.push({
        url: `${baseUrl}/${code}/journal/${ed.id}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    });

    // 6. Artifact Registry (Individual Products)
    // Limiting to first 5000 for crawl efficiency
    PRODUCTS.slice(0, 5000).forEach((prod) => {
      routes.push({
        url: `${baseUrl}/${code}/product/${prod.id}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.5,
      });
    });
  });

  return routes;
}
