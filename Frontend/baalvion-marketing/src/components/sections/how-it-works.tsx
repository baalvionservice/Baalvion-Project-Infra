import { Reveal } from '@/components/reveal';

const STEPS = [
  {
    step: '01',
    title: 'Requirement raised',
    body: 'A buyer defines what they need — specification, quantity, timeline, and budget — inside a structured requirement.',
  },
  {
    step: '02',
    title: 'Sourcing & matching',
    body: 'Qualified sellers are matched to the requirement, and quotes are submitted through the platform, not scattered email threads.',
  },
  {
    step: '03',
    title: 'Negotiation & approval',
    body: 'Terms are negotiated in-platform. A trade agent coordinates approvals and confirms both sides are aligned before commitment.',
  },
  {
    step: '04',
    title: 'Order execution',
    body: 'The confirmed order becomes the single record of truth — pricing, terms, and obligations locked and visible to all parties.',
  },
  {
    step: '05',
    title: 'Fulfillment & logistics',
    body: 'Shipment, documentation, and compliance milestones are tracked against the order as the goods move.',
  },
  {
    step: '06',
    title: 'Settlement & reporting',
    body: 'Completion triggers settlement and rolls the trade into reporting — closing the loop with a full audit trail.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-line py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">How the platform works</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            The end-to-end trade lifecycle, in six stages.
          </h2>
        </Reveal>

        <div className="relative mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((item, index) => (
            <Reveal key={item.step} delay={index * 60}>
              <div className="card h-full">
                <span className="font-mono text-2xl font-semibold text-muted-2">{item.step}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
