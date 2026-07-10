import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';
import { Reveal } from '@/components/reveal';
import { ContactForm } from '@/components/contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with the Baalvion team for sales enquiries, support, or partnership questions.',
};

/** Placeholder business details — replace with confirmed entity information before launch. */
const OFFICES = [
  { city: 'Placeholder HQ', region: 'Region / Country', note: 'Primary office' },
  { city: 'Placeholder Regional Office', region: 'Region / Country', note: 'Regional presence' },
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
                  Placeholder — registered entity name, address, and business identifiers to be
                  added here ahead of launch.
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
