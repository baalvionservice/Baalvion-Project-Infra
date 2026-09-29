import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const SITE_URL = "https://mining.baalvion.com";

/** Turn a URL slug into a readable display name (e.g. "copper-ore" → "Copper Ore"). */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Marketplace listing detail.
 *
 * NOTE: the page itself is a Client Component that renders MOCK, slug-derived
 * data — so this server layout can only see the route PARAM, not real product
 * records. We derive the richest HONEST title/description/canonical and emit
 * per-item Product JSON-LD from the humanized slug. We deliberately DO NOT
 * fabricate price/grade/purity/availability here (the client mock invents
 * those); JSON-LD carries only fields we can truthfully assert.
 *
 * Ceiling reached without a real product API + SSR — see the page's mock
 * `getProductData`. To go further: wire a real listing API and render specs
 * server-side (convert the page to a Server Component or pass data via params).
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const slug = productId || "listing";
  const name = humanizeSlug(slug);
  const title = `${name} — Suppliers, Specs & Pricing | Baalvion Mining`;
  const description = `Source verified ${name} on Baalvion Mining Inc. — view supplier credentials, request specifications, and start a secure RFQ. Availability and pricing on request.`;
  const canonical = `${SITE_URL}/marketplace/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Baalvion Mining Inc.",
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

export default async function MarketplaceProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const slug = productId || "listing";
  const name = humanizeSlug(slug);

  // Honest-only Product JSON-LD: name/category/brand/url. No price, grade,
  // purity, or availability — those are mock on the client and would be fabricated.
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    category: "Industrial Minerals",
    url: `${SITE_URL}/marketplace/${slug}`,
    brand: { "@type": "Brand", "name": "Baalvion Mining Inc." },
  };

  return (
    <>
      <JsonLd data={productSchema} />
      {children}
    </>
  );
}
