/**
 * @fileOverview Server-rendered JSON-LD (schema.org) builders for commerce + editorial pages.
 *
 * Pure functions that return plain objects ready to be `JSON.stringify`-ed into a
 * <script type="application/ld+json"> tag. No side effects, safe in Server Components.
 * Keeps the per-page structured data DRY and consistent with the Organization/WebSite
 * graph emitted by the root layout.
 */
import type { Product, Country } from "./types";
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

// schema.org country name, ISO'ish — deliberately spelled out (matches Country.name
// values like "USA"/"UK" only loosely; addressCountry wants a real country name/code).
const ADDRESS_COUNTRY_NAME: Record<string, string> = {
  us: "United States",
  uk: "United Kingdom",
  ae: "United Arab Emirates",
  in: "India",
  sg: "Singapore",
};

/**
 * Store/LocalBusiness schema for a market's real physical showroom (COUNTRIES[code].office
 * — no fabricated coordinates or hours, only the address/phone/email already on file).
 * Tells search + AI engines Amarisé has a genuine local presence in this market, not just
 * a currency-swapped page.
 */
export function localBusinessJsonLd(
  countryCode: string,
  country: Country
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${SITE_URL}/${countryCode}#store`,
    name: `Amarisé Maison Avenue — ${country.office.city}`,
    parentOrganization: ORG_REF,
    image: country.office.image || undefined,
    telephone: country.office.phone,
    email: country.office.email,
    url: `${SITE_URL}/${countryCode}/contact`,
    priceRange: "$$$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: country.office.address,
      addressLocality: country.office.city,
      addressCountry: ADDRESS_COUNTRY_NAME[countryCode] ?? country.name,
    },
    currenciesAccepted: country.currency,
  };
}

/** FAQPage schema from real CMS-authored Q&A (customer-service/faq content) — nothing
 * fabricated, only what an admin actually published. */
export function faqPageJsonLd(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
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
