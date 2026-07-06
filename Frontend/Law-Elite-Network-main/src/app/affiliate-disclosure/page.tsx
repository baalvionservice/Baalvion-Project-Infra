import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Handshake, Megaphone, ShieldCheck, Mail } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function AffiliateDisclosurePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Editorial Integrity</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Affiliate Disclosure
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              In the interest of transparency, the Federal Trade Commission requires that publishers disclose when
              they may receive compensation related to the links, referrals, or placements on their site. This page
              explains where that applies on Law Elite Network.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Handshake className="w-6 h-6 text-blue-600" />} title="Where Compensation May Apply">
              <p>
                Some outbound links on our site, and some placements within our{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">lawyer directory</Link>, may be
                compensated. This can include referral arrangements where a lawyer or firm pays a fee when a reader
                is connected to them through our{' '}
                <Link href="/appointments" className="text-blue-600 hover:underline">Appointments</Link> flow, and
                paid promotional placements described in more detail on our{' '}
                <Link href="/advertise" className="text-blue-600 hover:underline">Advertise</Link> page.
              </p>
            </Block>

            <Block icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} title="What Compensation Does Not Affect">
              <p>
                Compensation never influences which lawyers we designate as &quot;Verified,&quot; how we describe a
                legal topic, or the conclusions in our editorial coverage. Verification and editorial judgments are
                governed separately by our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>,
                which are applied identically to paying and non-paying listings. A lawyer&apos;s participation in a
                referral arrangement is a business relationship, not an editorial endorsement of quality or outcome.
              </p>
            </Block>

            <Block icon={<Megaphone className="w-6 h-6 text-blue-600" />} title="How Compensated Placements Are Labeled">
              <p>
                Where a link or listing involves compensation, we aim to make that clear in context — for example,
                through labeling within the directory or accompanying disclosure text near the placement. This is
                separate from, and complements, our{' '}
                <Link href="/sponsored-content-policy" className="text-blue-600 hover:underline">Sponsored Content Policy</Link>,
                which governs paid articles and featured posts rather than referral links.
              </p>
            </Block>

            <Block icon={<Mail className="w-6 h-6 text-blue-600" />} title="Questions">
              <p>
                If you have questions about a specific link, listing, or referral relationship, contact us at{' '}
                <a href="mailto:advertise@lawelitenetwork.com" className="text-blue-600 hover:underline">advertise@lawelitenetwork.com</a>{' '}
                or through our{' '}
                <Link href="/contact-us" className="text-blue-600 hover:underline">Contact Us</Link> page.
              </p>
            </Block>

          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Block({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 scroll-mt-32">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">{icon}</div>
        <h2 className="text-[28px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      </div>
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed space-y-4 pl-14">{children}</div>
    </div>
  );
}
