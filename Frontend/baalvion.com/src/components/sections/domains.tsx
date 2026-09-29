'use client';

import { useState } from 'react';
import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { TopologyFabric } from '@/components/topology-fabric';
import { DOMAINS } from '@/lib/content';

export function Domains() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <SectionShell
      id="domains"
      folio={DOMAINS.folio}
      label={DOMAINS.label}
      ghost={DOMAINS.ghost}
      labelledBy="domains-heading"
      pad="section"
      bg="surface"
    >
      <Reveal>
        <div className="max-w-3xl">
          <h2 id="domains-heading" className="running-head">
            {DOMAINS.headline}
          </h2>
          <p className="lead mt-6 text-muted">{DOMAINS.standfirst}</p>
        </div>
      </Reveal>

      {/* the live operational fabric */}
      <Reveal delay={120}>
        <div className="mx-auto mt-14 hidden max-w-3xl sm:block">
          <TopologyFabric active={active} onHover={setActive} variant="inline" />
        </div>
      </Reveal>

      {/* 2×2 instrument grid — one fabric, not four cards */}
      <div className="mt-12 grid gap-px border hairline bg-line sm:grid-cols-2">
        {DOMAINS.pillars.map((pillar, i) => {
          const on = active === pillar.id;
          return (
            <Reveal key={pillar.id} delay={i * 70}>
              <article
                tabIndex={0}
                aria-label={`${pillar.title} — operating domain`}
                onMouseEnter={() => setActive(pillar.id)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(pillar.id)}
                onBlur={() => setActive(null)}
                className={`group h-full p-8 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-accent md:p-10 ${
                  on ? 'bg-surface-2' : 'bg-surface'
                }`}
              >
                <span className="font-mono text-sm font-medium text-accent">{pillar.index}</span>
                <h3 className="display-h3 mt-4">{pillar.title}</h3>
                <p className="mt-2 text-sm font-medium text-muted">{pillar.tagline}</p>
                <p className="body mt-5">{pillar.body}</p>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t hairline pt-5">
                  {pillar.manifest.map((item) => (
                    <span key={item} className="mono-caption">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </SectionShell>
  );
}
