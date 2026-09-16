/**
 * @file (shipping)/shipping-directory/layout.tsx
 * @description Shell for the public World Shipping Directory.
 *
 * Its own route group, and its own layout, because this is a separate public property
 * served on its own subdomain (see middleware.ts) — not a page inside the authenticated
 * trade app. It renders no session chrome, no sidebar and no RouteGuard: every route
 * beneath it is anonymous, cacheable reference content.
 *
 * The visual language is modelled on careers.blackrock.com — white ground, near-black
 * type set tight, hairline rules rather than cards, and one saturated violet (#6F00EF,
 * their own --base-color) used only to mark something. It has to be declared here rather
 * than inherited: this layout is nested inside the Baalvion OS root layout, whose
 * globals.css paints a near-black body and a 1.5rem radius.
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import { Archivo, Archivo_Narrow } from 'next/font/google';
import './directory.css';
import { SITE_URL, SITE_NAME, href, canonical } from '@/lib/shipping-directory/site';

/**
 * BlackRock sets its sites in BLK Fort — a commissioned cut of Displaay's "Fort",
 * licensed to them and served from their CDN. It is not ours to use, and hotlinking it
 * would be both a licence breach and a broken page the day they rotate the path. Archivo
 * is the closest open equivalent: the same high x-height, tight apertures and flat
 * terminals, with a true narrow companion for the condensed labels BLK Fort Condensed
 * carries. `next/font` self-hosts it, which also keeps it inside the app's own CSP
 * (font-src 'self') instead of needing a Google Fonts exception.
 */
const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-blk',
  weight: ['400', '500', '600', '700', '800'],
});

const archivoNarrow = Archivo_Narrow({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-blk-cond',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    'Reference directory of shipping companies and merchant vessels worldwide — founders, leadership, ownership, fleets, tonnage, flag states and published capacity rankings, each figure shown with its source.',
  alternates: { canonical: canonical() },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: canonical(),
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

const NAV = [
  { href: href(), label: 'Overview', exact: true },
  { href: href('companies'), label: 'Companies' },
  { href: href('ships'), label: 'Ships' },
  { href: href('rankings'), label: 'Rankings' },
  { href: href('largest'), label: 'Largest ships' },
  { href: href('countries'), label: 'Countries' },
  { href: href('builders'), label: 'Builders' },
  { href: href('flags'), label: 'Flags' },
];

export default function ShippingDirectoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`wsd ${archivo.variable} ${archivoNarrow.variable} min-h-screen font-blk`}>
      {/* Utility strip. Says what this is and who publishes it before the reader has to ask. */}
      <div className="wsd-ink-field text-white">
        <div className="mx-auto flex max-w-[1340px] flex-wrap items-center justify-between gap-x-6 gap-y-1 px-6 py-2">
          <p className="wsd-eyebrow !text-white/60">
            A public reference property of Baalvion
          </p>
          <p className="wsd-eyebrow !text-white/60">
            Open data · every figure carries its source
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-40 border-b border-wsd-line-soft bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1340px] flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
          <Link href={href()} className="group flex items-center gap-3">
            {/* A bow-on hull mark. Drawn, not stock art — the site has no photography of
                its own and a generic anchor icon would be exactly the decoration the
                reference site avoids. */}
            <span aria-hidden className="flex h-8 w-8 items-center justify-center bg-wsd-violet">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="square">
                <path d="M3 16h18l-2.5 5H5.5L3 16Z" />
                <path d="M6 16V7h12v9" />
                <path d="M12 7V3" />
              </svg>
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[17px] font-extrabold tracking-[-0.02em] text-wsd-ink">
                World Shipping Directory
              </span>
              <span className="wsd-eyebrow mt-1">Companies · Ships · Fleets</span>
            </span>
          </Link>

          <nav aria-label="Directory sections" className="flex flex-wrap items-center gap-x-7 gap-y-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border-b-2 border-transparent pb-0.5 text-[15px] font-medium text-wsd-body transition-colors hover:border-wsd-violet hover:text-wsd-ink"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={href('ships')}
              className="inline-flex items-center gap-2 rounded-[2px] bg-wsd-ink px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-wsd-violet"
            >
              Search the registry
              <span aria-hidden>→</span>
            </Link>
          </nav>
        </div>
        <div className="h-[3px] bg-wsd-violet" />
      </header>

      <main>{children}</main>

      <footer className="mt-24 border-t border-wsd-ink bg-wsd-ground-alt">
        <div className="mx-auto max-w-[1340px] px-6 py-14">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <p className="wsd-eyebrow">About the figures on this site</p>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-wsd-body">
                Company and vessel records are built from{' '}
                <a href="https://www.wikidata.org" className="wsd-link" rel="noreferrer" target="_blank">Wikidata</a>{' '}
                (CC0), keyed on each ship&rsquo;s IMO number. Written summaries are quoted from{' '}
                <a href="https://en.wikipedia.org" className="wsd-link" rel="noreferrer" target="_blank">English Wikipedia</a>{' '}
                (CC BY-SA 4.0) and linked back to the article. Photographs are the work of their
                named photographers, reused under the licence shown beside each one.
                Container-capacity rankings and published fleet sizes come from the Alphaliner
                Top 100 as reproduced on Wikipedia, and carry the as-of date they were published with.
              </p>
            </div>

            <div>
              <p className="wsd-eyebrow">Two fleet numbers, never merged</p>
              <p className="mt-4 text-[14px] leading-relaxed text-wsd-body">
                <strong className="font-semibold text-wsd-ink">In this registry</strong> counts the
                individual ships we hold a record for — a verifiable lower bound.{' '}
                <strong className="font-semibold text-wsd-ink">Reported fleet</strong> is the figure
                the company or the industry press publishes. Reference data links only a minority of
                the world fleet to an operator, so for the largest lines these differ by an order of
                magnitude. Each is labelled wherever it appears, and where a value is unknown it is
                left blank rather than estimated.
              </p>
            </div>

            <div>
              <p className="wsd-eyebrow">Browse</p>
              <ul className="mt-4 space-y-2 text-[15px]">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="wsd-link">{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="wsd-hairline mt-12 flex flex-wrap items-center justify-between gap-4 pt-6">
            <p className="text-[13px] text-wsd-muted">
              © {new Date().getFullYear()} Baalvion. Directory content is reused under the licences
              named above; attribution travels with each record.
            </p>
            <p className="wsd-eyebrow">{SITE_URL.replace(/^https?:\/\//, '')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
