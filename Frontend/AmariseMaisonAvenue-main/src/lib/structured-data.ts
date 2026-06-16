/**
 * @fileOverview Server-rendered JSON-LD (schema.org) builders for commerce + editorial pages.
 *
 * Pure functions that return plain objects ready to be `JSON.stringify`-ed into a
 * <script type="application/ld+json"> tag. No side effects, safe in Server Components.
 * Keeps the per-page structured data DRY and consistent with the Organization/WebSite
 * graph emitted by the root layout.
 */
import type { Product } from "./types";
import { SITE_URL } from "./seo";

const ORG_REF = { "@id": `${SITE_URL}/#organization` } as const;

/** Map a catalog product's availability to a schema.org availability URL. */
function availabilityUrl(product: Pick<Product, "inStock" | "stock">): string {
  const available =
    product.inStock ?? (typeof product.stock === "number" ? product.stock > 0 : true);
  return available
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

/**
 * Product schema with Offer + brand for rich product results.
 * Price/currency come from the already country-resolved product (the page fetches
 * it with `?country=`), so no separate market argument is needed here.
 */
export function productJsonLd(
  product: Product,
  canonicalUrl: string
): Record<string, unknown> {
  const priceNumber =
    typeof product.price === "number" ? product.price : product.basePrice;
  const currency = product.currencyCode || "USD";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.seoDescription ||
      product.description ||
      `Discover the ${product.name} at Amarisé Maison Avenue.`,
    image: Array.isArray(product.imageUrl) ? product.imageUrl : [product.imageUrl],
    sku: product.id,
    brand: { "@type": "Brand", name: "Amarisé Maison Avenue" },
    ...(typeof product.rating === "number" && product.reviewsCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: canonicalUrl,
      priceCurrency: currency,
      price: priceNumber,
      availability: availabilityUrl(product),
      seller: ORG_REF,
    },
  };
}

/** BreadcrumbList from an ordered list of { name, url } crumbs. */
export function breadcrumbJsonLd(
  items: { name: string; url: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** ItemList of products for a collection / category listing page. */
export function itemListJsonLd(
  name: string,
  products: Pick<Product, "id" | "name">[],
  itemUrl: (id: string) => string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: products.length,
    itemListElement: products.map((p, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: itemUrl(p.id),
      name: p.name,
    })),
  };
}
