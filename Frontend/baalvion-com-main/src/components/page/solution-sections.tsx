import Link from 'next/link';
import type { SolutionSection } from '@/lib/site-pages';

interface CtaSpec {
  label: string;
  href: string;
}

interface SolutionSectionsProps {
  sections: SolutionSection[];
  closing: string;
  cta: CtaSpec;
  ctaSecondary?: CtaSpec;
}

function isExternal(href: string): boolean {
  return href.startsWith('http') || href.startsWith('mailto:');
}

function CtaLink({ label, href, primary }: CtaSpec & { primary?: boolean }) {
  const className = primary ? 'btn-primary' : 'btn-ghost';
  if (isExternal(href)) {
    return (
      <a href={href} className={className}>
        {label} <span aria-hidden="true">→</span>
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {label} <span aria-hidden="true">→</span>
    </Link>
  );
}

/**
 * Shared body for every "solution"-shaped page (Solutions audiences,
 * Partners): a grid of sections, then a closing line paired with one or two
 * CTAs. Kept as one component so the four pages that use this shape stay in
 * lockstep rather than drifting through copy-paste.
 */
export function SolutionSections({ sections, closing, cta, ctaSecondary }: SolutionSectionsProps) {
  return (
    <>
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <div className={`grid gap-px ${sections.length >= 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'}`}>
            {sections.map((s) => (
              <div key={s.heading} className="bg-surface p-8">
                <h2 className="display-h3 mb-3">{s.heading}</h2>
                <p className="body">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-deep">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">{closing}</p>
          <div className="flex flex-wrap gap-4">
            <CtaLink {...cta} primary />
            {ctaSecondary && <CtaLink {...ctaSecondary} />}
          </div>
        </div>
      </section>
    </>
  );
}
