import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { ROUTES } from '@/lib/content';
import { EMAIL } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Email Communications',
  description:
    'How and why Baalvion sends email. We send transactional email only — account verification, one-time sign-in codes, security alerts, recovery, and service notifications. We never send unsolicited bulk email or spam.',
  alternates: { canonical: '/email' },
};

export default function EmailPage() {
  return (
    <PageShell
      folio={EMAIL.folio}
      label={EMAIL.label}
      eyebrow={EMAIL.eyebrow}
      title={EMAIL.title}
      lede={EMAIL.lede}
    >
      {/* Intro */}
      <section className="border-b hairline bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <h2 className="running-head">Why email matters here</h2>
          </div>
          <div className="space-y-6 lg:col-span-8">
            {EMAIL.intro.map((p) => (
              <p key={p.slice(0, 24)} className="body-lg">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Types of email */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container py-16 md:py-20">
          <h2 className="running-head mb-3">The email we send</h2>
          <p className="body mb-10 max-w-2xl">
            Every message is transactional — generated in response to your own action or a
            security event on your account.
          </p>
          <div className="grid gap-px md:grid-cols-2">
            {EMAIL.types.map((t) => (
              <div key={t.kind} className="bg-surface p-7">
                <h3 className="display-h3 mb-1">{t.kind}</h3>
                <p className="mono-caption mb-4 text-accent">{t.trigger}</p>
                <p className="body">{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User journey */}
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <h2 className="running-head mb-3">The user journey, end to end</h2>
          <p className="body mb-10 max-w-2xl">
            From registration to recovery, here is exactly where email enters the experience —
            and why each message is necessary.
          </p>
          <ol className="grid gap-px md:grid-cols-3">
            {EMAIL.journey.map((j) => (
              <li key={j.step} className="bg-surface p-7">
                <div className="mb-4 flex items-center gap-3">
                  <span
                    className="grid h-8 w-8 place-items-center bg-accent text-sm font-semibold text-ink-deep"
                    aria-hidden="true"
                  >
                    {j.step}
                  </span>
                  <h3 className="display-h3">{j.title}</h3>
                </div>
                <p className="mono-caption mb-3 text-accent">✉ {j.email}</p>
                <p className="body">{j.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Commitments */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">Our commitments</p>
            <h2 className="running-head">Responsible sending, by policy.</h2>
          </div>
          <ul className="space-y-4 lg:col-span-8">
            {EMAIL.commitments.map((c) => (
              <li key={c.slice(0, 24)} className="body flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            Create an account to see the flow first-hand, or read how we protect your data.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href={ROUTES.register} className="btn-primary">
              Create an account <span aria-hidden="true">→</span>
            </Link>
            <Link href={ROUTES.privacy} className="btn-ghost">
              Privacy Policy <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
