import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Flag, Mail, Clock, CheckCircle2 } from 'lucide-react';

const LAST_UPDATED = 'June 30, 2026';

export default function CorrectionsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Accuracy & Trust</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Corrections Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Accuracy is the foundation of everything we publish. Law Elite Network is committed to correcting errors
              promptly and transparently. If you believe something on our site is inaccurate, outdated, or unclear, we
              want to hear from you — and we will act on it.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Flag className="w-6 h-6 text-blue-600" />} title="How to Report an Error">
              <p>
                Anyone can report a suspected error. The fastest way is to email our editorial team at{' '}
                <a href="mailto:corrections@lawelitenetwork.com" className="text-blue-600 hover:underline">corrections@lawelitenetwork.com</a>, or
                to reach us through our <Link href="/contact-us" className="text-blue-600 hover:underline">Contact</Link> page. To help us
                investigate quickly, please include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>The title or URL of the article in question;</li>
                <li>The specific statement or section you believe is incorrect;</li>
                <li>What you believe the accurate information is, and the jurisdiction it applies to;</li>
                <li>A source or reference supporting the correction, where you have one.</li>
              </ul>
              <p>
                You do not need to be a lawyer to report an error, and you do not need to be certain — if something looks
                wrong, tell us and we will check it.
              </p>
            </Block>

            <Block icon={<CheckCircle2 className="w-6 h-6 text-blue-600" />} title="How Corrections Are Handled">
              <p>
                Every report is reviewed by our editorial team. We verify the claim against authoritative sources in line
                with our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>. If
                we confirm an error, we correct it. If a report is well-intentioned but the content is accurate as
                written, we will explain why — and we will often clarify the wording so the same question does not arise
                again.
              </p>
              <p>
                We distinguish between minor fixes and substantive corrections. Minor changes — such as a typo, a broken
                link, or a small wording improvement — are made without a formal notice. Substantive corrections, which
                change the meaning or accuracy of legal information, are made promptly and noted on the affected page.
              </p>
            </Block>

            <Block icon={<Clock className="w-6 h-6 text-blue-600" />} title="How Corrections Are Timestamped">
              <p>
                Transparency matters as much as the fix itself. When we make a substantive correction, we update the
                &quot;last updated&quot; date shown on the article, and, where the change is material to a reader&apos;s
                understanding, we add a brief, dated note explaining what was corrected. This lets readers see both that a
                page is current and what changed. Our content is also reviewed on a recurring schedule, so corrections
                are part of an ongoing commitment to keeping the law we describe accurate over time.
              </p>
            </Block>

            <Block icon={<Mail className="w-6 h-6 text-blue-600" />} title="Contact">
              <p>
                To report an error or follow up on a previous report, email{' '}
                <a href="mailto:corrections@lawelitenetwork.com" className="text-blue-600 hover:underline">corrections@lawelitenetwork.com</a>.
                For other editorial questions, see our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link> or
                our <Link href="/about-us" className="text-blue-600 hover:underline">About Us</Link> page.
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
