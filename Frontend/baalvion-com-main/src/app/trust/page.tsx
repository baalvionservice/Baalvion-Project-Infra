import type { Metadata } from 'next';
import Link from 'next/link';
import { PageShell } from '@/components/page/page-shell';
import { CONTACT, ROUTES } from '@/lib/content';
import { TRUST_CENTER } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Trust Center',
  description:
    'The single index for how Baalvion protects accounts, structures accountability, and describes its own stage honestly — security, governance, reliability, and legal.',
  alternates: { canonical: '/trust' },
};

const CARDS = [
  {
    title: 'Security',
    body: 'Passwordless authentication, encryption in transit, tenant isolation, least-privilege access, and responsible disclosure.',
    href: ROUTES.security,
  },
  {
    title: 'Governance',
    body: 'How the foundation is structured, how jurisdiction and isolation are treated as architecture, and how accountability is enforced.',
    href: ROUTES.trustGovernance,
  },
  {
    title: 'Reliability',
    body: 'What is live today, how the identity layer works, and how we describe our own stage — without borrowing credibility across the two.',
    href: ROUTES.trustReliability,
  },
  {
    title: 'Legal & Policies',
    body: 'Terms of service, privacy policy, cookie policy, acceptable use, and data protection — the governing documents for every account.',
    href: ROUTES.privacy,
  },
];

export default function TrustCenterPage() {
  return (
    <PageShell
      folio={TRUST_CENTER.folio}
      label={TRUST_CENTER.label}
      eyebrow={TRUST_CENTER.eyebrow}
      title={TRUST_CENTER.title}
      lede={TRUST_CENTER.lede}
    >
      <section className="border-b hairline bg-ink">
        <div className="site-container py-16 md:py-20">
          <p className="lead max-w-3xl">{TRUST_CENTER.intro}</p>

          <div className="mt-14 grid gap-px border hairline bg-line sm:grid-cols-2">
            {CARDS.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group flex flex-col justify-between bg-ink p-8 transition-colors duration-200 hover:bg-surface md:p-10"
              >
                <div>
                  <h2 className="display-h3 mb-3">{card.title}</h2>
                  <p className="body">{card.body}</p>
                </div>
                <p className="mono-caption mt-8 text-accent transition-colors group-hover:text-accent-ink">
                  View {card.title.toLowerCase()} <span aria-hidden="true">→</span>
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink-deep">
        <div className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between md:py-20">
          <p className="lead max-w-xl">
            Reviewing Baalvion ahead of a partnership, an account, or an investment? Reach the
            team accountable for security or legal directly.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href={`mailto:${CONTACT.security}`} className="btn-primary">
              {CONTACT.security} <span aria-hidden="true">→</span>
            </a>
            <a href={`mailto:${CONTACT.legal}`} className="btn-ghost">
              {CONTACT.legal} <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
