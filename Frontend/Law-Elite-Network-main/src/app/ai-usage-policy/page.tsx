import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Bot, ShieldCheck, Flag, UserCheck } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function AiUsagePolicyPage() {
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
              AI Usage Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Artificial intelligence tools can help our editorial team research faster and draft more efficiently.
              They are never a substitute for qualified human judgment. This policy sets out where AI may assist in
              producing content on Law Elite Network, and the boundaries we do not cross.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Bot className="w-6 h-6 text-blue-600" />} title="Where AI May Assist">
              <p>
                Members of our editorial team may use AI tools for narrowly defined support tasks: organizing research
                notes, generating a first-draft outline, suggesting alternate phrasing, or summarizing lengthy public
                filings so a human editor can review them more efficiently. AI assistance is a drafting aid, not an
                author — every piece of AI-assisted drafting is treated as raw material subject to full editorial
                review before it is ever considered for publication.
              </p>
            </Block>

            <Block icon={<UserCheck className="w-6 h-6 text-blue-600" />} title="Human Review Is Mandatory">
              <p>
                No content reaches Law Elite Network without being reviewed, fact-checked, and edited by qualified
                human editorial staff, in line with our{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link> and{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
                A human editor is responsible for verifying every legal claim, citation, and conclusion before
                publication, and remains accountable for the accuracy of the final published page regardless of what
                tools were used during drafting.
              </p>
            </Block>

            <Block icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} title="What AI Is Never Used For">
              <p>
                AI is never used to fabricate or invent case citations, statutes, quotations, or legal conclusions.
                Every case reference, statutory citation, and quoted passage published on this site is verified
                against an authoritative primary source by a human editor before publication. If an AI-suggested
                citation cannot be verified, it is removed — it is never published on the assumption that it is
                probably correct.
              </p>
            </Block>

            <Block icon={<Flag className="w-6 h-6 text-blue-600" />} title="Flagging a Concern">
              <p>
                If you believe a page reads as AI-generated without adequate human review, or you have identified a
                citation, quote, or legal claim that appears fabricated or unverifiable, please tell us. Report it
                through our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> process or email{' '}
                <a href="mailto:corrections@lawelitenetwork.com" className="text-blue-600 hover:underline">corrections@lawelitenetwork.com</a>{' '}
                with the article URL and the specific statement in question. We investigate every report against our
                editorial standards and correct confirmed errors promptly.
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
