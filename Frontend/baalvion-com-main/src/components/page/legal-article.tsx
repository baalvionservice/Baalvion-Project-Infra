import Link from 'next/link';
import type { LegalDoc } from '@/lib/legal';
import { LEGAL_EFFECTIVE, LEGAL_INDEX } from '@/lib/legal';
import { ROUTES } from '@/lib/content';

const LEGAL_HREF: Record<string, string> = {
  privacy: ROUTES.privacy,
  terms: ROUTES.terms,
  cookies: ROUTES.cookies,
  'acceptable-use': ROUTES.acceptableUse,
  'data-protection': ROUTES.dataProtection,
};

/** Renders a single legal document plus a cross-index to the other policies. */
export function LegalArticle({ doc }: { doc: LegalDoc }) {
  return (
    <section className="border-b hairline bg-ink">
      <div className="site-container grid gap-12 py-16 md:py-20 lg:grid-cols-12 lg:gap-16">
        {/* sticky cross-index */}
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <p className="mono-label mb-4">Legal & policies</p>
            <ul className="space-y-2">
              {LEGAL_INDEX.map((d) => {
                const isCurrent = d.slug === doc.slug;
                return (
                  <li key={d.slug}>
                    <Link
                      href={LEGAL_HREF[d.slug]}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`text-sm transition-colors ${
                        isCurrent
                          ? 'text-accent'
                          : 'text-foreground/70 hover:text-foreground'
                      }`}
                    >
                      {d.shortTitle}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mono-caption mt-8">Last updated {LEGAL_EFFECTIVE}</p>
          </div>
        </aside>

        {/* document body */}
        <article className="max-w-3xl lg:col-span-9">
          <p className="body-lg mb-12 border-l-2 border-accent pl-5">{doc.summary}</p>

          <div className="space-y-12">
            {doc.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="display-h3 mb-4">{s.heading}</h2>
                {s.paragraphs?.map((p) => (
                  <p key={p.slice(0, 32)} className="body mb-4">
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 space-y-2">
                    {s.bullets.map((b) => (
                      <li key={b.slice(0, 32)} className="body flex gap-3">
                        <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 bg-accent" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
