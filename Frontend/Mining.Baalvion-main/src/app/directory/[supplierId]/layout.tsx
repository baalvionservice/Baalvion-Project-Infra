import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const SITE_URL = "https://mining.baalvion.com";

/** Turn a URL slug into a readable company name (e.g. "atlas-minerals" → "Atlas Minerals"). */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Supplier profile detail.
 *
 * NOTE: the page itself is a Client Component rendering MOCK, slug-derived data
 * (rating, reviews, certifications, stats are all invented). This server layout
 * sees only the route PARAM, so it derives the richest HONEST
 * title/description/canonical and emits per-supplier Organization JSON-LD from
 * the humanized slug. We deliberately OMIT aggregateRating, address country,
 * and certifications — those are mock on the client and must not be asserted as
 * structured data.
 *
 * Ceiling reached without a real supplier API + SSR — see the page's mock
 * `getSupplierData`. To go further: wire a real supplier/KYC API and render the
 * profile server-side.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ supplierId: string }>;
}): Promise<Metadata> {
  const { supplierId } = await params;
  const slug = supplierId || "supplier";
  const name = humanizeSlug(slug);
  const title = `${name} — Verified Mineral Supplier | Baalvion Mining`;
  const description = `${name} on the Baalvion Mining Inc. supplier directory — review verified credentials, product lines, and trade capabilities, then invite to RFQ.`;
  const canonical = `${SITE_URL}/directory/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Baalvion Mining Inc.",
      type: "profile",
    },
    robots: { index: true, follow: true },
  };
}

export default async function SupplierProfileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ supplierId: string }>;
}) {
  const { supplierId } = await params;
  const slug = supplierId || "supplier";
  const name = humanizeSlug(slug);

  // Honest-only Organization JSON-LD: name + profile URL. No rating, address, or
  // certifications — those are mock on the client and would be fabricated.
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: `${SITE_URL}/directory/${slug}`,
  };

  return (
    <>
      <JsonLd data={organizationSchema} />
      {children}
    </>
  );
}
