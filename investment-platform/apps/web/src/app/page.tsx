import Link from 'next/link';

const STATS = [
  { label: 'Onboard in', value: '6 min', note: 'KYC to first deal' },
  { label: 'Countries served', value: '180+', note: 'multi-currency rails' },
  { label: 'Settlement', value: 'Escrow', note: 'funds protected' },
];

const STEPS = [
  ['Onboard & verify', 'Sign up from any country. Identity, KYC and AML are completed digitally via Sumsub in minutes.'],
  ['Discover & match', 'Browse vetted opportunities. AI matching surfaces deals that fit your thesis, stage and ticket.'],
  ['Diligence & negotiate', 'Access the data room, run due diligence and negotiate privately in a secure deal room.'],
  ['Sign & fund', 'Execute agreements with digital signatures and fund into escrow via Stripe & Wise.'],
  ['Track & earn', 'Monitor valuations, returns, distributions and tax documents from one dashboard.'],
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-6xl px-6">
      <nav className="flex items-center justify-between py-6">
        <span className="text-lg font-semibold tracking-tight">
          Baalvion<span style={{ color: 'var(--color-accent)' }}>Invest</span>
        </span>
        <div className="flex gap-3">
          <Link href="/login" className="btn btn-ghost">
            Sign in
          </Link>
          <Link href="/register" className="btn btn-primary">
            Start investing
          </Link>
        </div>
      </nav>

      <section className="grid gap-10 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
        <div>
          <span className="tag">Global private markets, end to end</span>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
            Invest in the world&apos;s best companies —{' '}
            <span style={{ color: 'var(--color-gold)' }}>without borders.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg" style={{ color: 'var(--color-muted)' }}>
            From onboarding and due diligence to negotiation, escrow funding and
            portfolio tracking — the entire investment lifecycle in one secure,
            compliant platform.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/register" className="btn btn-primary">
              Create investor account
            </Link>
            <Link href="/login" className="btn btn-ghost">
              I already invest here
            </Link>
          </div>
        </div>

        <div className="grid content-start gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="card p-5">
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {s.label}
              </div>
              <div className="mt-1 text-3xl font-semibold">{s.value}</div>
              <div className="text-sm" style={{ color: 'var(--color-muted)' }}>
                {s.note}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pb-24">
        <h2 className="text-sm uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
          How it works
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {STEPS.map(([title, body], i) => (
            <div key={title} className="card p-5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold"
                style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)' }}
              >
                {i + 1}
              </div>
              <div className="mt-3 font-semibold">{title}</div>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
