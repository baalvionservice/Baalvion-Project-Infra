import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { CONTACT, ROUTES } from '@/lib/content';
import { SECURITY } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Security',
  description:
    'How Baalvion protects your data and account: passwordless authentication, encryption in transit, tenant isolation, least-privilege access, and responsible disclosure.',
  alternates: { canonical: '/security' },
};

export default function SecurityPage() {
  return (
    <PageShell
      folio={SECURITY.folio}
      label={SECURITY.label}
      eyebrow={SECURITY.eyebrow}
      title={SECURITY.title}
      lede={SECURITY.lede}
    >
      {/* Practices */}
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <h2 className="running-head mb-10">How we protect the platform</h2>
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3">
            {SECURITY.practices.map((p) => (
              <div key={p.title} className="bg-surface p-7">
                <h3 className="display-h3 mb-3">{p.title}</h3>
                <p className="body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="border-b hairline bg-ink-deep">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{SECURITY.commitments.label}</p>
            <h2 className="running-head">Privacy and protection, by default.</h2>
          </div>
          <ul className="space-y-4 lg:col-span-8">
            {SECURITY.commitments.items.map((c) => (
              <li key={c.slice(0, 24)} className="body flex gap-3">
                <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 bg-accent" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Disclosure */}
      <section className="bg-ink">
        <div className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4">
            <p className="mono-label mb-4 text-accent">{SECURITY.disclosure.label}</p>
            <h2 className="running-head">Found something? Tell us.</h2>
          </div>
          <div className="lg:col-span-8">
            <p className="body-lg mb-6">{SECURITY.disclosure.body}</p>
            <div className="flex flex-wrap gap-4">
              <a href={`mailto:${CONTACT.security}`} className="btn-primary">
                {CONTACT.security} <span aria-hidden="true">→</span>
              </a>
              <Link href={ROUTES.dataProtection} className="btn-ghost">
                Data Protection Policy <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
