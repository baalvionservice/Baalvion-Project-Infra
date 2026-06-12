import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { PRESENCE } from '@/lib/content';

export function Presence() {
  return (
    <SectionShell
      id="presence"
      folio={PRESENCE.folio}
      label={PRESENCE.label}
      ghost={PRESENCE.ghost}
      labelledBy="presence-heading"
      pad="dense"
      bg="ink"
    >
      <Reveal>
        <h2 id="presence-heading" className="running-head max-w-2xl">
          {PRESENCE.headline}
        </h2>
      </Reveal>

      {/* the typographic meridian — reach as posture, not pins */}
      <Reveal delay={100}>
        <div className="mt-16">
          <p className="mono-caption mb-6">Operating posture · Worldwide</p>
          <div className="relative">
            <div className="h-px w-full bg-line-strong" />
            <div className="grid grid-cols-3">
              {PRESENCE.regions.map((region, i) => (
                <div
                  key={region}
                  className={
                    i === 0
                      ? 'justify-self-start text-left'
                      : i === 1
                        ? 'justify-self-center text-center'
                        : 'justify-self-end text-right'
                  }
                >
                  <span
                    aria-hidden="true"
                    className={`block h-3 w-px -translate-y-1/2 bg-line-strong ${
                      i === 0 ? '' : i === 1 ? 'mx-auto' : 'ml-auto'
                    }`}
                  />
                  <p className="mono-label mt-4">{region}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={160}>
        <p className="body-lg mt-14 max-w-3xl">{PRESENCE.body}</p>
      </Reveal>
    </SectionShell>
  );
}
