import { Reveal } from '@/components/reveal';

const BENEFITS = [
  'Faster sourcing cycles, because qualified counterparties are matched inside the platform instead of assembled by hand.',
  'Fewer disputes, because every term, approval, and status change is timestamped and attributed.',
  'Lower coordination overhead, because trade agents manage exceptions instead of relaying routine updates.',
  'Cleaner audits, because the trade record is the platform record — not a reconstruction from emails and spreadsheets.',
  'Better forecasting, because reporting reflects live pipeline and order data rather than periodic manual rollups.',
];

export function PlatformOrgBenefits() {
  return (
    <section className="border-b border-line py-24">
      <div className="container-site grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <p className="eyebrow">Benefits for organizations</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            What changes when trade runs on one platform.
          </h2>
        </Reveal>
        <Reveal delay={100}>
          <ul className="space-y-5">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-4">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-iris-cyan"
                  aria-hidden="true"
                />
                <p className="text-base leading-relaxed text-muted">{benefit}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
