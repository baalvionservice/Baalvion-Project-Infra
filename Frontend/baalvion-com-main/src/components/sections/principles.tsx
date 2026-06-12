import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { PRINCIPLES } from '@/lib/content';

export function Principles() {
  return (
    <SectionShell
      id="principles"
      folio={PRINCIPLES.folio}
      label={PRINCIPLES.label}
      ghost={PRINCIPLES.ghost}
      labelledBy="principles-heading"
      pad="section"
      bg="ink"
    >
      <Reveal>
        <h2 id="principles-heading" className="running-head max-w-2xl">
          {PRINCIPLES.headline}
        </h2>
      </Reveal>

      <div className="mt-14 border-b hairline">
        {PRINCIPLES.items.map((principle, i) => (
          <Reveal key={principle.numeral} delay={i * 60}>
            <div className="grid gap-2 border-t hairline py-7 md:grid-cols-[4rem_minmax(0,18rem)_1fr] md:items-baseline md:gap-10">
              <span className="font-mono text-sm tracking-[0.18em] text-muted-2">
                {principle.numeral}
              </span>
              <h3 className="display-h3">{principle.title}</h3>
              <p className="body max-w-xl">{principle.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
