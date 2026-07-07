import { Reveal } from '@/components/reveal';
import { StatGrid, type Stat } from '@/components/ui/stat-grid';

// Placeholder figures — replace with verified, audited metrics before launch.
const STATS: Stat[] = [
  { value: '01', label: 'Shared source of truth', note: 'per trade, across every role' },
  { value: '06', label: 'Lifecycle stages tracked', note: 'sourcing through settlement' },
  { value: '24/7', label: 'Visibility into order status', note: 'no waiting on email replies' },
  { value: '100%', label: 'Actions attributed & timestamped', note: 'full audit trail by default' },
];

export function Stats() {
  return (
    <section className="border-b border-line py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">By the numbers</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built to make trade measurable, not just manageable.
          </h2>
        </Reveal>
        <div className="mt-14">
          <StatGrid stats={STATS} />
        </div>
      </div>
    </section>
  );
}
