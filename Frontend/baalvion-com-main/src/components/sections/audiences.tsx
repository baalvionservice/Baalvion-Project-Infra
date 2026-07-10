import Link from 'next/link';
import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { SOLUTIONS_HUB } from '@/lib/site-pages';

/** Homepage audience router — who engages with the foundation, one click from
 *  the front page, immediately before the closing conversion moment. */
export function Audiences() {
  return (
    <SectionShell
      id="audiences"
      folio="§ 08"
      label="Audiences"
      ghost="08"
      labelledBy="audiences-heading"
      pad="section"
      bg="surface"
    >
      <Reveal>
        <div className="max-w-3xl">
          <h2 id="audiences-heading" className="running-head">
            Built for every counterpart that depends on it.
          </h2>
          <p className="lead mt-6 text-muted">
            However you engage with Baalvion — as an institution, a financial partner, a
            regulator, a partner, or an investor — the foundation is the same. How you meet it
            differs.
          </p>
        </div>
      </Reveal>

      <div className="mt-12 border-b hairline">
        {SOLUTIONS_HUB.audiences.map((audience, i) => (
          <Reveal key={audience.title} delay={i * 60}>
            <Link href={audience.href} className="ledger-row group">
              <span className="mono-caption">{String(i + 1).padStart(2, '0')}</span>
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-lg leading-tight text-foreground">
                  {audience.title}
                </span>
                <span className="text-sm leading-relaxed text-muted">{audience.body}</span>
              </span>
              <span className="mono-caption md:text-right">
                Read more <span aria-hidden="true">→</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
