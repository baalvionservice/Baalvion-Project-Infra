import { Reveal } from '@/components/reveal';

const PILLARS = [
  {
    title: 'One record per trade',
    body: 'Every requirement, quote, approval, and shipment update lives against a single order — not three inboxes and a spreadsheet.',
  },
  {
    title: 'Role-aware workflow',
    body: 'Buyers, sellers, and trade agents each see the view built for their job, while working against the same underlying data.',
  },
  {
    title: 'Built-in accountability',
    body: 'Every action is attributed, timestamped, and auditable — so disputes get resolved with evidence, not guesswork.',
  },
];

export function PlatformOverview() {
  return (
    <section id="overview" className="border-b border-line py-24 scroll-mt-20">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Platform overview</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A trade platform built around the deal, not the department.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Most procurement stacks split a single trade across five disconnected systems.
            Baalvion keeps sourcing, negotiation, compliance, and fulfillment inside one
            operating layer so nothing gets lost in translation.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 80}>
              <div className="card h-full">
                <span className="font-mono text-xs text-muted-2">0{index + 1}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
