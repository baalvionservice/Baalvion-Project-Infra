import { Reveal } from '@/components/reveal';

const COMPARISON = [
  {
    without: 'Requirements live in email threads and get lost between reply-alls.',
    with: 'Requirements are structured records, versioned and visible to every party.',
  },
  {
    without: 'Pricing and terms get renegotiated verbally with no paper trail.',
    with: 'Every term change is logged, timestamped, and attributed to a named party.',
  },
  {
    without: 'Status updates depend on someone remembering to send an email.',
    with: 'Status updates automatically as each stage of the trade lifecycle completes.',
  },
  {
    without: 'Reporting means manually reconciling spreadsheets after the fact.',
    with: 'Reporting reflects live trade data — no reconciliation, no stale numbers.',
  },
];

export function WhyBaalvion() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <Reveal>
          <p className="eyebrow">Why choose Baalvion</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for teams who are tired of trade running on trust and spreadsheets.
          </h2>
          <p className="mt-5 text-base leading-relaxed text-muted">
            Global trade doesn't fail because people don't work hard — it fails because
            information fragments across tools that were never designed to talk to each other.
            Baalvion exists to close that gap with a platform that treats transparency,
            security, and accountability as defaults, not add-ons.
          </p>
        </Reveal>

        <Reveal delay={100} className="glass-panel divide-y divide-line p-2">
          {COMPARISON.map((row) => (
            <div key={row.with} className="grid gap-4 p-5 sm:grid-cols-2">
              <div className="flex gap-3">
                <span className="mt-0.5 text-muted-2" aria-hidden="true">
                  &times;
                </span>
                <p className="text-sm leading-relaxed text-muted-2">{row.without}</p>
              </div>
              <div className="flex gap-3">
                <span className="mt-0.5 text-cyan" aria-hidden="true">
                  &#10003;
                </span>
                <p className="text-sm leading-relaxed text-foreground">{row.with}</p>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
