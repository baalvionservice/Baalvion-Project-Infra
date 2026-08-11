import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

/**
 * Not yet linked from nav/footer/sitemap and deliberately noindexed -- see
 * src/data/countries.ts: no article carries country metadata yet, so this
 * section is genuinely empty today. Same AdSense-safety idiom already used
 * for empty A-Z glossary letters (src/app/legal/[letter]/layout.tsx) and the
 * (removed) lawyer directory this session -- thin/empty pages stay out of the
 * indexable surface until they have real content. Flip to indexed + linked +
 * sitemapped once at least one article carries real country metadata.
 */
export const metadata: Metadata = {
  title: { absolute: 'Legal Guides by Country | Law Elite Network' },
  alternates: { canonical: `${SITE}/countries` },
  robots: { index: false, follow: true },
};

export default function CountriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
