import Link from 'next/link';
import Image from 'next/image';
import { counts, productsByCategory, productById } from '@/lib/products';
import type { Product } from '@/lib/products';
import { StatusChip } from '@/components/StatusChip';
import { catalogueGraph, organizationGraph, jsonLd } from '@/lib/structured-data';

// Fully static: the catalogue changes when the registry changes, which is a deploy, so there is
// nothing to revalidate on a timer. The whole index is crawlable HTML with no JS required.
export const dynamic = 'force-static';

// The hero shows one property rather than a montage — a real screenshot of a real product reads
// as evidence; a grid of thumbnails at hero size reads as decoration.
const HERO_ID = 'gti';

export default function HomePage() {
  const sections = productsByCategory();
  const { total, live, inDevelopment, internal } = counts();
  const hero = productById(HERO_ID);

  return (
    <>
      {/* Declares the 19 properties as one company's portfolio. Without this each domain competes
          as a stranger and the group's authority never consolidates. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(organizationGraph()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(catalogueGraph()) }} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="border-b border-[hsl(var(--line))]">
        <div className="mx-auto grid max-w-[1584px] lg:grid-cols-2">
          <div className="flex flex-col justify-center border-[hsl(var(--line))] px-6 py-16 lg:border-r lg:py-24 lg:pr-14">
            <p className="label flex items-center gap-3 text-[hsl(var(--muted-ink))]">
              <span aria-hidden className="h-px w-8 bg-[hsl(var(--accent))]" />
              The Baalvion portfolio
            </p>
            <h1 className="display mt-8">
              Every product we build,
              <br />
              and what it does.
            </h1>
            <p className="mt-8 max-w-xl text-[18px] font-light leading-relaxed text-[hsl(var(--muted-ink))]">
              Baalvion Industries designs, builds and operates infrastructure across trade,
              commerce, markets and knowledge. This is the complete index — not a selection — with
              the operating status of each property stated plainly.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="#corporate"
                className="group inline-flex items-center gap-6 bg-[hsl(var(--accent))] py-3.5 pl-5 pr-4 text-[15px] text-white transition-colors hover:brightness-90"
              >
                Browse the catalogue
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </a>
              <a
                href="https://about.baalvion.com"
                className="inline-flex items-center gap-6 border border-[hsl(var(--line))] py-3.5 pl-5 pr-4 text-[15px] transition-colors hover:bg-[hsl(var(--paper-alt))]"
              >
                About the company
              </a>
            </div>
          </div>

          {/* A live property, shown at scale. */}
          {hero?.image && (
            <Link
              href={`/products/${hero.id}`}
              className="group relative block overflow-hidden bg-[hsl(var(--paper-alt))]"
            >
              <Image
                src={hero.image}
                alt={`${hero.name} homepage`}
                width={1600}
                height={1000}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 pt-16 text-white">
                <span>
                  <span className="label text-white/70">In the portfolio</span>
                  <span className="mt-1.5 block text-[22px] font-light">{hero.name}</span>
                  {hero.tagline && (
                    <span className="mt-1 block text-[14px] text-white/80">{hero.tagline}</span>
                  )}
                </span>
                <span
                  aria-hidden
                  className="shrink-0 text-[22px] leading-none transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </span>
            </Link>
          )}
        </div>
      </section>

      {/* ── Counts ────────────────────────────────────────────────────────────
          Every figure is derived from the registry. A hardcoded "20+ products" is exactly the
          number that goes stale within a month and that nobody notices. */}
      <section className="bg-[hsl(var(--ink))] text-[hsl(var(--ink-invert))]">
        <dl className="mx-auto grid max-w-[1584px] grid-cols-2 md:grid-cols-4">
          {[
            { label: 'Products', value: total },
            { label: 'Live', value: live },
            { label: 'In development', value: inDevelopment },
            { label: 'Internal', value: internal },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`border-[hsl(var(--line-invert))] px-6 py-9 ${i % 2 === 1 ? 'border-l' : ''} ${
                i >= 2 ? 'border-t md:border-t-0' : ''
              } ${i === 2 ? 'md:border-l' : ''}`}
            >
              <dd className="text-[40px] font-light leading-none tabular-nums">{stat.value}</dd>
              <dt className="label mt-3 text-white/55">{stat.label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Catalogue ─────────────────────────────────────────────────────── */}
      {sections.map((section) => (
        <section
          key={section.category}
          id={slugify(section.category)}
          className="mx-auto max-w-[1584px] scroll-mt-12 px-6"
        >
          <div className="flex items-baseline justify-between border-b border-[hsl(var(--line))] pb-4 pt-20">
            <h2 className="display-sm">{section.category}</h2>
            <span className="font-mono text-[13px] tabular-nums text-[hsl(var(--muted-ink))]">
              {String(section.products.length).padStart(2, '0')}
            </span>
          </div>

          <ul className="grid gap-x-8 gap-y-14 pt-10 sm:grid-cols-2 lg:grid-cols-3">
            {section.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <li>
      <Link href={`/products/${product.id}`} className="group flex h-full flex-col">
        {/* 16:10 frame either way, so a card with a screenshot and one without still line up. */}
        <div className="relative aspect-[16/10] overflow-hidden border border-[hsl(var(--line))] bg-[hsl(var(--paper-alt))]">
          {product.image ? (
            <Image
              src={product.image}
              alt={`${product.name} homepage`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            // Nothing to photograph. Say why, rather than filling the frame with a stock image
            // or a sibling product's screenshot.
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--muted-ink))]">
                Not yet serving traffic
              </span>
              {product.domain && (
                <span className="font-mono text-[12px] text-[hsl(var(--muted-ink))]">
                  {product.domain}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col pt-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[21px] font-light leading-snug tracking-[-0.01em] transition-colors group-hover:text-[hsl(var(--accent))]">
              {product.name}
            </h3>
            <StatusChip status={product.status} />
          </div>

          {/* The property's own headline, then the factual description beneath it. */}
          {product.tagline && (
            <p className="mt-2 text-[15px] text-[hsl(var(--ink))]">{product.tagline}</p>
          )}

          {product.description ? (
            <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-[hsl(var(--muted-ink))]">
              {product.description}
            </p>
          ) : (
            <p className="mt-3 text-[14px] italic text-[hsl(var(--muted-ink))]">
              No description published yet.
            </p>
          )}

          <span className="mt-auto flex items-center justify-between pt-5">
            {product.domain ? (
              <span className="font-mono text-[12px] text-[hsl(var(--muted-ink))]">
                {product.domain}
              </span>
            ) : (
              <span />
            )}
            <span
              aria-hidden
              className="text-[19px] leading-none text-[hsl(var(--accent))] transition-transform duration-200 group-hover:translate-x-1"
            >
              →
            </span>
          </span>
        </div>
      </Link>
    </li>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
