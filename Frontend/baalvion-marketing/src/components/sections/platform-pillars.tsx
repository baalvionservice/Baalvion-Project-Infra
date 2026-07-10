import { Reveal } from '@/components/reveal';

const PILLARS = [
  {
    title: 'Security',
    body: 'Role-based access control, encrypted document handling, and session-level auditing protect commercially sensitive terms at every stage.',
  },
  {
    title: 'Transparency',
    body: 'Pricing, status, and approvals are visible to every party with a legitimate stake in the trade — not siloed inside one inbox.',
  },
  {
    title: 'Efficiency',
    body: 'Structured requirements and quotes replace unstructured back-and-forth, cutting the time between sourcing and confirmed order.',
  },
  {
    title: 'Automation',
    body: 'Routine approvals, notifications, and document generation run automatically, so teams focus on negotiation and judgment calls.',
  },
  {
    title: 'Reporting',
    body: 'Dashboards are generated directly from live trade data — accurate the moment you open them, not after a manual reconciliation pass.',
  },
];

export function PlatformPillars() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">What the platform is built on</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Five commitments that shape every feature we ship.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((pillar, index) => (
            <Reveal key={pillar.title} delay={index * 60}>
              <div className="card h-full">
                <h3 className="text-base font-semibold text-foreground">{pillar.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{pillar.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
