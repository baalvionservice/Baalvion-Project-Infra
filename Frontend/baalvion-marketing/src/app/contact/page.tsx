import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { ContactForm } from '@/components/contact-form';
import {
  CIN,
  ENTITY_TYPE,
  INCORPORATED_ON,
  LEGAL_ENTITY_NAME,
  OPERATING_ADDRESS,
  REGISTERED_ADDRESS,
} from '@baalvion/company';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Baalvion team for sales enquiries, support, or partnership questions.',
};

/**
 * The real registered and operating addresses, from @baalvion/company — the same source the
 * IR and about sites use. These replace two "Placeholder HQ / Region / Country" entries that
 * would have shipped as the company's offices.
 */
const OFFICES = [
  {
    city: `${OPERATING_ADDRESS.locality}, ${OPERATING_ADDRESS.region}`,
    region: OPERATING_ADDRESS.country === 'IN' ? 'India' : OPERATING_ADDRESS.country,
    note: 'Operating office',
  },
  {
    city: `${REGISTERED_ADDRESS.locality}, ${REGISTERED_ADDRESS.region}`,
    region: REGISTERED_ADDRESS.country === 'IN' ? 'India' : REGISTERED_ADDRESS.country,
    note: `Registered office · ${LEGAL_ENTITY_NAME} · CIN ${CIN}`,
  },
];

export default function ContactPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Contact"
          title="Talk to the Baalvion team."
          description="Whether you're evaluating the platform, need support as an existing customer, or want to explore a partnership — we're glad to help."
        />

        <section className="border-b border-line py-24">
          <div className="container-site grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
            <Reveal className="space-y-10">
              <div>
                <p className="eyebrow">Sales enquiries</p>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  Evaluating Baalvion for your organization? Use the form to tell us about your
                  trade operation and we&rsquo;ll follow up with next steps.
                </p>
              </div>
              <div>
                <p className="eyebrow">Support</p>
                <p className="mt-3 text-base leading-relaxed text-muted">
                  Existing customers should sign in to the Trade Portal for the fastest support
                  path. For anything else, use this form and select &ldquo;Existing customer
                  support&rdquo;.
                </p>
              </div>
              <div>
                <p className="eyebrow">Business information</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-2">
                  {LEGAL_ENTITY_NAME} · {ENTITY_TYPE}
                  <br />
                  CIN {CIN} · Incorporated {INCORPORATED_ON}
                  <br />
                  {REGISTERED_ADDRESS.street}, {REGISTERED_ADDRESS.locality},{' '}
                  {REGISTERED_ADDRESS.region} {REGISTERED_ADDRESS.postalCode}
                </p>
              </div>
              <div>
                <p className="eyebrow">Office locations</p>
                <div className="mt-3 space-y-3">
                  {OFFICES.map((office) => (
                    <div key={office.city} className="rounded-lg border border-line bg-surface-2/60 p-4">
                      <p className="text-sm font-semibold text-foreground">{office.city}</p>
                      <p className="text-xs text-muted-2">{office.region}</p>
                      <p className="mt-1 text-xs text-muted-2">{office.note}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            <Reveal delay={100}>
              <ContactForm />
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
