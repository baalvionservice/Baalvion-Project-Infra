import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms governing use of baalvion.com and the Baalvion Trade Portal.',
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Legal"
          title="Terms of Service"
          description="Placeholder — the full terms of service, covering platform usage, obligations, and liability, will be published here ahead of launch."
        />
        <section className="py-24">
          <div className="container-site max-w-3xl space-y-6 text-sm leading-relaxed text-muted">
            <p>
              This page is a placeholder for Baalvion&rsquo;s Terms of Service. The final terms
              will describe acceptable use of baalvion.com and the Trade Portal, account
              responsibilities, intellectual property, limitation of liability, and dispute
              resolution.
            </p>
            <p>
              Until the finalized terms are published, please contact us directly with any
              questions via the Contact page.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
