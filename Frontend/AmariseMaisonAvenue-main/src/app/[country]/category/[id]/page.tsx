
import React from "react";
import { Metadata } from "next";
import CategoryPageClient from "@/components/category/CategoryPageClient";
import { getCategorySidebar } from "@/lib/mock-category-data";

// ── Category label map ────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  // New Arrivals
  "new-arrivals-handbags": "Hermès Handbags - New Arrivals",
  "new-arrivals-hermes": "Hermès Handbags - New Arrivals",
  "new-arrivals-chanel-handbags-and-accessories": "Chanel Bags - New Arrivals",
  "view-all-new-arrivals": "Other Brands - New Arrivals",
  "jewelry-new-arrivals": "Jewelry - New Arrivals",

  // Hermès Bags
  "hermes-handbags": "Hermès Bags",
  "hermes-birkin-handbags": "Hermès Birkin Bags",
  "hermes-kelly-handbags": "Hermès Kelly Bags",
  "hermes-constance-handbags": "Hermès Constance Bags",
  "hermes-evelyne-bags": "Hermès Evelyne Bags",
  "hermes-picotin-bags": "Hermès Picotin Bags",
  "hermes-lindy-bags": "Hermès Lindy Bags",
  "hermes-bolide-bags": "Hermès Bolide Bags",
  "hermes-herbag-collection": "Hermès Herbag Collection",
  "hermes-clutch": "Hermès Pochettes & Kelly Cuts",
  "hermes-hss-special-order-bags": "Hermès HSS Special Order Bags",
  "hermes-exotic-handbags": "Hermès Exotics",
  "hermes-rare-handbags": "Hermès Rare & Unique",
  "hermes-pre-owned-vintage": "Pre-Owned Hermès Bags",
  "bag-besties-organizers": "Bag Besties",

  // Hermès Accessories
  "hermes-wallets": "Hermès Wallets",
  "hermes-belts": "Hermès Belts",
  "hermes-charms": "Hermès Charms",
  "hermes-scarves": "Hermès Scarves",
  "hermes-shoes": "Hermès Shoes",

  // Watches & Jewelry
  "watches": "Hermès Watches",
  "jewelry": "Fine Jewelry",
  "fine-jewelry": "Fine Jewelry",
  "costume-jewelry": "Costume Jewelry",
  "vintage-chanel-jewelry": "Vintage Chanel Jewelry",
  "chanel-contemporary-jewelry": "Contemporary Chanel Jewelry",
  "jewelry-vintage": "Vintage Jewelry",
  "jewelry-contemporary": "Contemporary Jewelry",

  // Chanel Bags
  "chanel-bags": "Chanel Bags",
  "chanel-flap-bags": "Chanel Flap Bags",
  "chanel-classic-mini": "Chanel Mini Flap Bags",
  "chanel-classic-small": "Chanel Small Flap Bags",
  "chanel-classic-medium": "Chanel Medium Flap Bags",
  "chanel-jumbo-maxi-flaps": "Chanel Jumbo & Maxi Flap Bags",
  "chanel-22-bags": "Chanel 22 Bags",
  "chanel-25-bags": "Chanel 25 Bags",
  "chanel-tote": "Chanel Totes",
  "chanel-wallet-on-chain": "Chanel Wallet on Chain",
  "chanel-fashion-runway-bags": "Chanel Fashion & Runway Bags",
  "chanel-wallets": "Chanel Wallets",
  "chanel-shoes": "Chanel Shoes",
  "chanel-pre-owned": "Pre-Owned Chanel Bags",

  // Goyard
  "goyard": "Goyard Bags",
  "goyard-st-louis-bags": "Goyard St. Louis Totes",
  "goyard-saigon-bags": "Goyard Saigon Bags",
  "goyard-anjou-bags": "Goyard Anjou Bags",
  "goyard-artois-bags": "Goyard Artois Bags",
  "goyard-other-styles": "Goyard Other Styles",

  // Other Brands
  "other-bags-1": "Other Bags",
  "the-row-bags": "The Row Bags",
  "louis-vuitton-bags": "Louis Vuitton Bags",
  "christian-dior-bags": "Christian Dior Bags",
  "fendi-bags": "Fendi Bags",
  "loro-piana-bags": "Loro Piana Bags",
};

function getCategoryLabel(id: string): string {
  if (!id) return "Collection";

  // 1. Direct match
  if (CATEGORY_LABELS[id]) return CATEGORY_LABELS[id];

  // 2. Heuristic formatting for unmatched IDs (e.g. "hermes-birkin-30cm")
  let result = id
    .split("-")
    .map((w) => {
      // Keep capitalization for certain words like "HSS", don't format 'cm' numbers weirdly
      if (w.toLowerCase() === "hss") return "HSS";
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");

  // Fix brand names
  result = result.replace(/Hermes/gi, "Hermès");

  // Ensure "Bags" suffix if the category implies it but doesn't have it
  if (id.includes('handbags') || id.includes('bags')) {
    result = result.replace('Handbags', 'Bags');
  } else if (!result.includes('Bags') && !result.includes('Jewelry') && !result.includes('Watches') && !result.includes('Wallets') && !result.includes('Shoes') && !result.includes('Belts')) {
    result += " Bags";
  }

  return result;
}

function getCategoryBrandName(id: string): string {
  if (!id) return "Collection";

  const idLower = id.toLowerCase();
  if (idLower.startsWith("hermes") || idLower === "new-arrivals-handbags" || idLower === "bag-besties-organizers") {
    return "Hermès";
  }
  if (idLower.includes("chanel")) {
    return "Chanel";
  }
  if (idLower.startsWith("goyard")) {
    return "Goyard";
  }
  if (idLower.includes("jewelry") || idLower === "watches") {
    return "Fine Jewelry";
  }
  if (
    idLower === "other-bags-1" ||
    idLower === "view-all-new-arrivals" ||
    idLower.includes("row") ||
    idLower.includes("dior") ||
    idLower.includes("vuitton") ||
    idLower.includes("fendi") ||
    idLower.includes("piana")
  ) {
    return "Other Brands";
  }

  return "Collection";
}

// ── Data / hooks ──────────────────────────────────────────────────────────────

interface CategoryPageProps {
  params: Promise<{
    id: string;
    country: string;
  }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id, country } = await params;
  const pageTitle = getCategoryLabel(id);
  const brandName = getCategoryBrandName(id);

  return {
    title: `${pageTitle} | ${brandName} | AMARISÉ MAISON`,
    description: `Discover our curated collection of ${pageTitle.toLowerCase()} from ${brandName}. Shop authentic luxury items with expert authentication and concierge service.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { id, country } = await params;
  const pageTitle = getCategoryLabel(id);
  const brandName = getCategoryBrandName(id);
  const sidebarSections = getCategorySidebar(id);

  return (
    <CategoryPageClient
      id={id}
      country={country}
      pageTitle={pageTitle}
      brandName={brandName}
      sidebarSections={sidebarSections}
    />
  );
}
