import { Reveal } from '@/components/reveal';
import { TRADE_PORTAL } from '@/lib/site';

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-mesh-hero">
      <div className="grid-backdrop absolute inset-0" aria-hidden="true" />
      <div className="container-site relative grid gap-16 py-24 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-32">
        <Reveal>
          <p className="eyebrow">Global trade operations platform</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Procurement and trade,
            <span className="text-gradient"> run from one shared source of truth.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Baalvion connects buyers, sellers, and trade agents inside a single operating layer —
            replacing scattered spreadsheets, email chains, and disconnected tools with one
            transparent workflow from sourcing to fulfillment.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a href={TRADE_PORTAL.login} className="btn-primary focus-ring">
              Sign In
            </a>
            <a href="#overview" className="btn-secondary focus-ring">
              Learn More
            </a>
          </div>
          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-8">
            {/* Placeholder figures — replace with verified, audited metrics before launch. */}
            <div>
              <dt className="text-xs text-muted-2">Active roles</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-foreground">3</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-2">Trade lifecycle stages</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-foreground">6</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-2">Source of truth</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-foreground">1</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={120} className="relative">
          <HeroWorkflowGraphic />
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Abstract workflow visual built from layout primitives (no external assets).
 * Swap for commissioned illustration or product screenshot when available.
 */
function HeroWorkflowGraphic() {
  const nodes = [
    { label: 'Buyer', detail: 'Raises requirement' },
    { label: 'Trade Agent', detail: 'Coordinates + approves' },
    { label: 'Seller', detail: 'Fulfills order' },
  ];

  return (
    <div className="glass-panel p-6 sm:p-8">
      <p className="eyebrow">Live workflow</p>
      <div className="mt-6 space-y-4">
        {nodes.map((node, index) => (
          <div key={node.label} className="flex items-center gap-4 rounded-xl border border-line bg-surface-3/60 p-4">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-iris-cyan font-mono text-sm font-semibold text-on-accent">
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{node.label}</p>
              <p className="text-xs text-muted">{node.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-xl border border-dashed border-line-strong p-4">
        <p className="text-xs leading-relaxed text-muted-2">
          Every step above updates the same order record — no re-keying data between teams, no
          conflicting versions of the truth.
        </p>
      </div>
    </div>
  );
}
