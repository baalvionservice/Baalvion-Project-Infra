import Link from 'next/link';
import { Reveal } from '@/components/reveal';

const ROLES = [
  {
    href: '/solutions/buyers',
    label: 'Buyers',
    body: 'Post requirements, compare qualified sellers, and track every order from approval to delivery.',
  },
  {
    href: '/solutions/sellers',
    label: 'Sellers',
    body: 'Respond to live demand, manage quotes and fulfillment, and get paid against a transparent order trail.',
  },
  {
    href: '/solutions/trade-agents',
    label: 'Trade Agents',
    body: 'Coordinate both sides, manage approvals, and keep every trade moving without chasing status updates.',
  },
];

export function CustomerJourney() {
  return (
    <section className="border-b border-line py-24">
      <div className="container-site">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">The customer journey</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three roles. One workflow. Zero translation loss.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            Baalvion is built around how trade actually happens — a buyer with a need, a seller
            who can meet it, and a trade agent keeping both sides accountable to the same terms.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {ROLES.map((role, index) => (
            <Reveal key={role.label} delay={index * 80}>
              <Link href={role.href} className="focus-ring group card block h-full">
                <span className="eyebrow">{role.label}</span>
                <p className="mt-4 text-base leading-relaxed text-muted">{role.body}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  Explore {role.label.toLowerCase()} solutions
                  <span aria-hidden="true" className="transition-transform duration-200 ease-out-expo group-hover:translate-x-1">
                    &rarr;
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
