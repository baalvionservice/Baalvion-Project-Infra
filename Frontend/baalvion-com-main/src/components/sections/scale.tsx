import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { CountUp } from '@/components/count-up';
import { SCALE } from '@/lib/content';

export function Scale() {
  return (
    <SectionShell
      id="scale"
      folio={SCALE.folio}
      label={SCALE.label}
      ghost={SCALE.ghost}
      labelledBy="scale-heading"
      pad="monument"
      bg="ink"
    >
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="scale-heading" className="running-head max-w-xl">
            The shape of the foundation, stated plainly.
          </h2>
          <p className="mono-caption">{SCALE.caption}</p>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-14 grid grid-cols-1 gap-px border hairline bg-line sm:grid-cols-2 lg:grid-cols-3">
          {SCALE.figures.map((figure) => {
            const isNumber = typeof figure.value === 'number';
            return (
              <div key={figure.caption} className="bg-ink p-8 md:p-10">
                {isNumber ? (
                  <p className="font-mono text-[clamp(3rem,2rem+4vw,5rem)] font-medium leading-none text-foreground">
                    <CountUp value={figure.value as number} />
                  </p>
                ) : (
                  <p className="font-display text-[clamp(1.5rem,1.1rem+1.4vw,2.25rem)] leading-tight text-foreground">
                    {figure.value}
                  </p>
                )}
                <p className="body mt-5 max-w-[24ch] text-sm">{figure.caption}</p>
              </div>
            );
          })}
        </div>
      </Reveal>
    </SectionShell>
  );
}
