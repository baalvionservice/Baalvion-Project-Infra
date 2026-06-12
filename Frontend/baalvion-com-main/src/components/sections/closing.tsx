import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { CLOSING } from '@/lib/content';

export function Closing() {
  return (
    <SectionShell
      id="closing"
      folio={CLOSING.folio}
      label={CLOSING.label}
      labelledBy="closing-heading"
      pad="monument"
      bg="ink-deep"
      center
    >
      <Reveal>
        <h2 id="closing-heading" className="display-hero mx-auto max-w-4xl">
          {CLOSING.headline}
          <span className="seal" aria-hidden="true" />
        </h2>
        <p className="body-lg mx-auto mt-8 max-w-2xl">{CLOSING.body}</p>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <a href={CLOSING.primaryCta.href} className="btn-primary">
            {CLOSING.primaryCta.label}
            <span aria-hidden="true">→</span>
          </a>
          <a href={CLOSING.secondaryCta.href} className="btn-ghost">
            {CLOSING.secondaryCta.label}
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </Reveal>
    </SectionShell>
  );
}
