import type { Metadata } from 'next';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PageHero } from '@/components/ui/page-hero';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Baalvion collects, uses, and protects information across baalvion.com and the Trade Portal.',
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="outline-none">
        <PageHero
          eyebrow="Legal"
          title="Privacy Policy"
          description="Placeholder — the full privacy policy, covering data collection, processing, retention, and your rights, will be published here ahead of launch."
        />
        <section className="py-24">
          <div className="container-site max-w-3xl space-y-6 text-sm leading-relaxed text-muted">
            <p>
              This page is a placeholder for Baalvion&rsquo;s Privacy Policy. The final policy will
              describe what information is collected across baalvion.com and the Trade Portal, how
              it is used and stored, who it may be shared with, and how users can exercise their
              data rights.
            </p>
            <p>
              Until the finalized policy is published, please contact us directly with any privacy
              questions via the Contact page.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
