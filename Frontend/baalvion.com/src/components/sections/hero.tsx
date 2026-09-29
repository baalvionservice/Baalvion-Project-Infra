import { Reveal } from '@/components/reveal';
import { TopologyFabric } from '@/components/topology-fabric';
import { HERO } from '@/lib/content';

export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-heading" className="relative bg-ink-deep">
      <div className="site-container relative flex min-h-[100svh] flex-col justify-end">
        <span className="spine" aria-hidden="true" />

        {/* ambient topology fabric — structural, not decorative */}
        <div
          className="pointer-events-none absolute right-0 top-1/2 hidden w-[48%] max-w-2xl -translate-y-1/2 lg:block"
          aria-hidden="true"
        >
          <TopologyFabric active={null} variant="hero" />
        </div>

        <div className="ledger-content relative z-10 max-w-3xl pb-[var(--space-monument)] pt-36">
          <Reveal>
            <p className="mono-label">{HERO.eyebrow}</p>
          </Reveal>
          <Reveal delay={120}>
            <h1 id="hero-heading" className="display-hero mt-9">
              {HERO.headline}
              <span className="seal" aria-hidden="true" />
            </h1>
          </Reveal>
          <Reveal delay={220}>
            <p className="body-lg mt-9 max-w-2xl">{HERO.subline}</p>
          </Reveal>
          <Reveal delay={320}>
            <div className="mono-caption mt-9 flex flex-wrap items-center gap-x-3 gap-y-2">
              {HERO.coordinates.map((coordinate, i) => (
                <span key={coordinate} className="flex items-center gap-x-3">
                  {i > 0 && <span aria-hidden="true" className="text-muted-2/50">/</span>}
                  {coordinate}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={420}>
            <div className="mt-12 flex flex-wrap items-center gap-4">
              <a href={HERO.primaryCta.href} className="btn-primary">
                {HERO.primaryCta.label}
                <span aria-hidden="true">→</span>
              </a>
              <a href={HERO.secondaryCta.href} className="btn-ghost">
                {HERO.secondaryCta.label}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
