import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Megaphone, Tag, ShieldCheck, Eye } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function SponsoredContentPolicyPage() {
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
              Sponsored Content Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Law Elite Network occasionally works with law firms, legal service providers, and other partners on
              sponsored posts and featured placements. This policy explains how sponsored content is labeled,
              reviewed, and kept separate from our independent editorial judgment.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Tag className="w-6 h-6 text-blue-600" />} title="Clear Labeling">
              <p>
                Any post, article, or featured-lawyer placement that is paid for or provided by a partner is clearly
                labeled as sponsored, paid, or in partnership with the relevant party, wherever it appears on the
                site. We do not present paid material as if it were produced independently by our newsroom. This
                labeling requirement applies consistently, regardless of the size of the partner or the format of the
                placement.
              </p>
            </Block>

            <Block icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} title="Same Editorial Bar">
              <p>
                Sponsored content is still held to the same factual and legal accuracy standard as regular content,
                as described in our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
                Claims about the law, a legal process, or a firm&apos;s track record are checked before publication
                just as they would be in unsponsored coverage. A sponsorship does not permit inaccurate, misleading,
                or unverifiable claims.
              </p>
            </Block>

            <Block icon={<Megaphone className="w-6 h-6 text-blue-600" />} title="Editorial Final Approval">
              <p>
                Our editorial team retains final approval over the content, framing, and publication of any sponsored
                or partner material. A sponsor may propose topics or provide background information, but they do not
                control the final wording, and our editors can decline or request changes to a sponsored piece that
                does not meet our standards.
              </p>
            </Block>

            <Block icon={<Eye className="w-6 h-6 text-blue-600" />} title="Verified vs. Paid Placement">
              <p>
                It is important to distinguish two separate designations on our site. A &quot;Verified&quot; badge in
                our{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">lawyer directory</Link> reflects an
                editorial or credentialing check, described in our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
                A paid or sponsored placement, by contrast, reflects a commercial arrangement disclosed under our{' '}
                <Link href="/editorial-disclosure-policy" className="text-blue-600 hover:underline">Editorial, DMCA &amp; Disclosure Policy</Link>.
                A listing can be both, one, or neither — paying for placement does not itself confer Verified status.
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
        <h2 className="text-[22px] md:text-[28px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      </div>
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed space-y-4 pl-14">{children}</div>
    </div>
  );
}
