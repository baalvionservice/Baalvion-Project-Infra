import { SectionShell } from '@/components/structure/section-shell';
import { Reveal } from '@/components/reveal';
import { NETWORK } from '@/lib/content';

export function Network() {
  return (
    <SectionShell
      id="network"
      folio={NETWORK.folio}
      label={NETWORK.label}
      ghost={NETWORK.ghost}
      labelledBy="network-heading"
      pad="section"
      bg="surface"
    >
      <Reveal>
        <div className="max-w-3xl">
          <h2 id="network-heading" className="running-head">
            {NETWORK.headline}
          </h2>
          <p className="body-lg mt-6">{NETWORK.intro}</p>
        </div>
      </Reveal>

      <div className="mt-16 space-y-16">
        {NETWORK.groups.map((group) => (
          <Reveal key={group.key}>
            <div>
              <div className="mb-2 flex items-baseline justify-between gap-4 border-b hairline-strong pb-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground">
                  {group.group}
                </h3>
                <span className="mono-caption">
                  {group.group.toUpperCase().slice(0, 9)} / {String(group.entries.length).padStart(2, '0')}
                </span>
              </div>
              <p className="body mb-2 text-sm">{group.note}</p>

              <div>
                {group.entries.map((entry) => (
                  <a key={entry.node} href={entry.href} className="ledger-row group">
                    <span className="mono-caption">{entry.node}</span>
                    <span className="flex flex-col gap-1.5">
                      <span className="font-display text-lg leading-tight text-foreground">
                        {entry.name}
                      </span>
                      <span className="text-sm leading-relaxed text-muted">
                        {entry.description}
                      </span>
                    </span>
                    <span className="mono-caption md:text-right">
                      {entry.domain} <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </SectionShell>
  );
}
