import { Reveal } from '@/components/reveal';

const BENEFITS = [
  {
    title: 'Transparency by default',
    body: 'Status, pricing, and approvals are visible to every party that needs them — no more chasing updates over email.',
  },
  {
    title: 'Faster cycle times',
    body: 'Structured workflows replace back-and-forth negotiation threads, cutting the time between requirement and fulfillment.',
  },
  {
    title: 'Security at every layer',
    body: 'Role-based access, encrypted document handling, and full audit trails protect sensitive commercial terms.',
  },
  {
    title: 'Automation where it counts',
    body: 'Routine approvals, notifications, and document generation run automatically, freeing teams for judgment calls.',
  },
  {
    title: 'Reporting that reflects reality',
    body: 'Dashboards are generated from live trade data, not manually reconciled spreadsheets assembled after the fact.',
  },
  {
    title: 'Operational efficiency',
    body: 'One platform for sourcing, negotiation, and logistics removes the coordination overhead of stitching tools together.',
  },
];

export function KeyBenefits() {
  return (
    <section className="border-b border-line bg-surface py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Why teams choose Baalvion</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything a trade operation needs, none of the busywork.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <div key={benefit.title} className="bg-surface-2 p-7">
              <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{benefit.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
