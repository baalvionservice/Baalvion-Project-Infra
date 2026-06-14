import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";

const SITE_URL = "https://mining.baalvion.com";

/** Turn a URL slug into a readable guide title. */
function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Guide detail.
 *
 * NOTE: the page itself is a Client Component rendering MOCK, slug-derived data
 * (author, publish date, read time, and body are all invented). This server
 * layout sees only the route PARAM, so it derives the richest HONEST
 * title/description/canonical and emits per-guide TechArticle JSON-LD from the
 * humanized slug. We deliberately OMIT datePublished and a named author —
 * those are mock on the client and must not be asserted as structured data.
 *
 * Ceiling reached without a real guide/CMS API + SSR — see the page's mock
 * `getGuideData`. To go further: wire the guides to the central CMS (as the
 * /blog route already is) and render the body server-side.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = rawSlug || "handbook";
  const title = humanizeSlug(slug);
  const description = `${title} — practical mineral trade, compliance, and logistics guidance from Baalvion Mining Inc. for verified exporters and industrial buyers.`;
  const canonical = `${SITE_URL}/guides/${slug}`;

  return {
    title: `${title} | Trade Guides`,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Baalvion Mining Inc.",
      type: "article",
    },
    robots: { index: true, follow: true },
  };
}

export default async function GuideDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = rawSlug || "handbook";
  const title = humanizeSlug(slug);

  // Honest-only TechArticle JSON-LD: headline + organization author/publisher +
  // canonical URL. No datePublished or named human author — those are mock on
  // the client and would be fabricated.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    url: `${SITE_URL}/guides/${slug}`,
    author: { "@type": "Organization", "name": "Baalvion Mining Inc." },
    publisher: { "@type": "Organization", "name": "Baalvion Mining Inc." },
    about: "Industrial mineral trade and export compliance",
  };

  return (
    <>
      <JsonLd data={articleSchema} />
      {children}
    </>
  );
}
