import type { Metadata } from 'next';
import { PageShell } from '@/components/page/page-shell';
import { ContactForm } from '@/components/contact/contact-form';
import { CONTACT } from '@/lib/content';
import { CONTACT_PAGE } from '@/lib/site-pages';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Contact Baalvion. Reach support, business, privacy, security, or legal directly, or send a message. We aim to respond within two business days.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <PageShell
      folio={CONTACT_PAGE.folio}
      label={CONTACT_PAGE.label}
      eyebrow={CONTACT_PAGE.eyebrow}
      title={CONTACT_PAGE.title}
      lede={CONTACT_PAGE.lede}
    >
      <section className="border-b hairline bg-ink">
        <div className="site-container grid gap-12 py-16 md:py-20 lg:grid-cols-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-7">
            <h2 className="running-head mb-8">Send a message</h2>
            <ContactForm />
          </div>

          {/* Channels + company */}
          <div className="space-y-10 lg:col-span-5">
            <div>
              <p className="mono-label mb-5">Direct channels</p>
              <ul className="divide-y divide-line">
                {CONTACT_PAGE.channels.map((c) => (
                  <li key={c.email} className="py-4">
                    <a
                      href={`mailto:${c.email}`}
                      className="group flex flex-col gap-0.5"
                    >
                      <span className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-foreground">{c.label}</span>
                        <span className="mono-caption text-accent transition-colors group-hover:text-accent-ink">
                          {c.email}
                        </span>
                      </span>
                      <span className="body text-sm">{c.desc}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border hairline bg-surface p-7">
              <p className="mono-label mb-4 text-accent">{CONTACT_PAGE.company.label}</p>
              <div className="space-y-3">
                {CONTACT_PAGE.company.lines.map((line) => (
                  <p key={line.slice(0, 24)} className="body text-sm">
                    {line}
                  </p>
                ))}
              </div>
              <p className="mono-caption mt-6">
                Response window — {CONTACT.responseWindow}
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
