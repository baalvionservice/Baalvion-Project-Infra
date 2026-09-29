import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { EXTERNAL, INSIGHT } from '@/lib/content';

export function Insight() {
  return (
    <SectionShell
      id="insight"
      folio={INSIGHT.folio}
      label={INSIGHT.label}
      ghost={INSIGHT.ghost}
      labelledBy="insight-heading"
      pad="section"
      bg="ink"
    >
      <Reveal>
        <h2 id="insight-heading" className="running-head max-w-2xl">
          {INSIGHT.headline}
        </h2>
      </Reveal>

      <div className="mt-14 border-b hairline">
        {INSIGHT.dispatches.map((dispatch, i) => (
          <Reveal key={dispatch.title} delay={i * 70}>
            <a href={EXTERNAL.about} className="ledger-row group">
              <span className="mono-caption">{dispatch.category}</span>
              <span className="flex flex-col gap-1.5">
                <span className="font-display text-lg leading-snug text-foreground">
                  {dispatch.title}
                </span>
                <span className="body text-sm">{dispatch.dek}</span>
              </span>
              <span className="mono-caption md:text-right">
                Read <span aria-hidden="true">↗</span>
              </span>
            </a>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <p className="body mt-8 max-w-2xl">
          Read the institutional perspective at{' '}
          <a href={EXTERNAL.about} className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent active:text-accent-ink">
            about.baalvion.com
          </a>{' '}
          and the long-horizon thesis at{' '}
          <a href={EXTERNAL.ir} className="text-foreground underline decoration-line-strong underline-offset-4 transition-colors hover:text-accent hover:decoration-accent active:text-accent-ink">
            ir.baalvion.com
          </a>
          .
        </p>
      </Reveal>
    </SectionShell>
  );
}
