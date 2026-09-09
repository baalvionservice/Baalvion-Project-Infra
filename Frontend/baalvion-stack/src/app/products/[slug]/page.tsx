import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { PRODUCTS, productById, STATUS_LABEL } from '@/lib/products';
import { StatusChip } from '@/components/StatusChip';
import { productGraph, jsonLd } from '@/lib/structured-data';

// Every product page exists as static HTML at build time — the catalogue is crawlable without a
// bot having to execute JavaScript, and a new registry entry produces a new page on the next build.
export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.id }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = productById(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.id}` },
    openGraph: {
      title: `${product.name} — Baalvion Stack`,
      description: product.description,
      url: `/products/${product.id}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = productById(slug);
  if (!product) notFound();

  const related = PRODUCTS.filter((p) => p.category === product.category && p.id !== product.id);

  return (
    <article className="mx-auto max-w-[1584px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(productGraph(product)) }} />
      <nav
        aria-label="Breadcrumb"
        className="border-b border-[hsl(var(--line))] px-6 py-3 text-[13px] text-[hsl(var(--muted-ink))]"
      >
        <Link href="/" className="transition-colors hover:text-[hsl(var(--accent))]">
          Products
        </Link>
        <span aria-hidden className="px-2 text-[hsl(var(--line))]">
          /
        </span>
        <Link
          href={`/#${product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          className="transition-colors hover:text-[hsl(var(--accent))]"
        >
          {product.category}
        </Link>
      </nav>

      <header className="grid border-b border-[hsl(var(--line))] lg:grid-cols-12">
        <div className="border-[hsl(var(--line))] px-6 py-16 lg:col-span-8 lg:border-r lg:py-20">
          <StatusChip status={product.status} />
          <h1 className="display mt-6">{product.name}</h1>

          {/* The property's own headline, in its own words. */}
          {product.tagline && (
            <p className="mt-5 max-w-2xl text-[22px] font-light leading-snug">{product.tagline}</p>
          )}

          {product.description && (
            <p className="mt-8 max-w-2xl text-[19px] font-light leading-relaxed text-[hsl(var(--muted-ink))]">
              {product.description}
            </p>
          )}

          {product.href ? (
            <a
              href={product.href}
              className="group mt-10 inline-flex items-center gap-8 bg-[hsl(var(--accent))] py-4 pl-5 pr-4 text-[15px] text-white transition-colors hover:brightness-90"
            >
              Visit {product.domain}
              <span aria-hidden className="text-[18px] leading-none transition-transform duration-200 group-hover:translate-x-1">
                →
              </span>
            </a>
          ) : (
            // No link for a property that does not serve traffic — a dead link would contradict
            // the status shown directly above it.
            <p className="mt-10 border-l-2 border-[hsl(var(--line))] pl-4 text-[15px] text-[hsl(var(--muted-ink))]">
              {product.status === 'internal'
                ? 'Internal system — not publicly accessible.'
                : 'Not serving traffic yet.'}
              {product.domain && (
                <>
                  {' '}
                  Reserved at <span className="font-mono text-[13px]">{product.domain}</span>.
                </>
              )}
            </p>
          )}
        </div>

        {product.capabilities && product.capabilities.length > 0 && (
          <div className="px-6 pb-16 lg:col-span-4 lg:px-8 lg:py-20">
            <p className="label text-[hsl(var(--muted-ink))]">What it covers</p>
            <ul className="mt-5 divide-y divide-[hsl(var(--line))] border-y border-[hsl(var(--line))]">
              {product.capabilities.map((c) => (
                <li key={c} className="py-3 text-[15px] font-light">
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
      </header>

      {/* The product's actual homepage. A screenshot of the real thing is the only image on this
          page that could be honest — a stock photo of a shipping container would say nothing
          about whether this product exists or what it looks like. */}
      {product.image && (
        <figure className="border-b border-[hsl(var(--line))] bg-[hsl(var(--paper-alt))]">
          <div className="mx-auto max-w-[1584px] px-6 py-12">
            <div className="relative aspect-[16/9] overflow-hidden border border-[hsl(var(--line))] bg-white">
              <Image
                src={product.image}
                alt={`${product.name} homepage at ${product.domain}`}
                fill
                priority
                sizes="(max-width: 1584px) 100vw, 1584px"
                className="object-cover object-top"
              />
            </div>
            <figcaption className="mt-3 font-mono text-[12px] text-[hsl(var(--muted-ink))]">
              {product.domain} — captured from the live site
            </figcaption>
          </div>
        </figure>
      )}

      {/* Facts straight from the registry — nothing in this block is maintained by hand. */}
      <section>
        <h2 className="label px-6 pb-4 pt-14 text-[hsl(var(--muted-ink))]">Record</h2>
        <dl className="grid border-l border-t border-[hsl(var(--line))] sm:grid-cols-2">
          <Row label="Status" value={STATUS_LABEL[product.status]} />
          <Row label="Category" value={product.category} />
          <Row
            label={product.domains.length > 1 ? 'Domains' : 'Domain'}
            value={product.domains.length ? product.domains.join(', ') : '—'}
            mono
          />
          <Row
            label="Payments"
            value={
              product.rails.length
                ? product.rails.join(', ').replace(/_/g, ' ')
                : 'Not a payment-taking property'
            }
          />
          <div className="border-b border-r border-[hsl(var(--line))] px-6 py-6 sm:col-span-2">
            <dt className="label text-[hsl(var(--muted-ink))]">Services</dt>
            <dd className="mt-3 flex flex-wrap gap-2">
              {product.services.length ? (
                product.services.map((s) => (
                  <span
                    key={s}
                    className="border border-[hsl(var(--line))] bg-[hsl(var(--paper-alt))] px-2.5 py-1.5 font-mono text-[12px]"
                  >
                    {s}
                  </span>
                ))
              ) : (
                <span className="text-[15px] text-[hsl(var(--muted-ink))]">—</span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {related.length > 0 && (
        <section>
          <h2 className="label px-6 pb-4 pt-14 text-[hsl(var(--muted-ink))]">
            Also in {product.category}
          </h2>
          <ul className="grid border-l border-t border-[hsl(var(--line))] sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <li key={p.id} className="border-b border-r border-[hsl(var(--line))]">
                <Link
                  href={`/products/${p.id}`}
                  className="group flex items-center justify-between gap-4 px-6 py-6 transition-colors hover:bg-[hsl(var(--paper-alt))]"
                >
                  <span>
                    <span className="text-[17px] font-light">{p.name}</span>
                    {p.domain && (
                      <span className="mt-1 block font-mono text-[12px] text-[hsl(var(--muted-ink))]">
                        {p.domain}
                      </span>
                    )}
                  </span>
                  <span
                    aria-hidden
                    className="text-[18px] leading-none text-[hsl(var(--accent))] transition-transform duration-200 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="border-b border-r border-[hsl(var(--line))] px-6 py-6">
      <dt className="label text-[hsl(var(--muted-ink))]">{label}</dt>
      <dd className={`mt-2 ${mono ? 'font-mono text-[13px]' : 'text-[16px] font-light'}`}>
        {value}
      </dd>
    </div>
  );
}
