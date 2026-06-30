import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { AlertTriangle, Scale, BookOpen, ExternalLink } from 'lucide-react';

const LAST_UPDATED = 'June 30, 2026';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'Law Elite Network provides general legal information for educational purposes only. It is not legal advice and does not create an attorney–client relationship.',
  alternates: { canonical: '/disclaimer' },
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Legal Notice</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Disclaimer
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          {/* Primary YMYL notice — the single most important block for a legal site */}
          <div className="border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl p-8 mb-16 flex items-start gap-5">
            <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0 mt-1" />
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-slate-900">Not Legal Advice</h2>
              <p className="text-slate-700 leading-relaxed">
                The information published on Law Elite Network (lawelitenetwork.com) is provided for
                general informational and educational purposes only. It is <strong>not legal advice</strong>,
                and it should not be relied upon as a substitute for advice from a licensed attorney in your
                jurisdiction. Laws change frequently and vary by location and circumstance.
              </p>
            </div>
          </div>

          <section className="space-y-16">

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="No Attorney–Client Relationship">
              <p>
                Reading our articles, using our tools, contacting us, or otherwise engaging with this website
                does not create an attorney–client relationship between you and Law Elite Network or any
                contributor, editor, or practitioner featured on the platform. An attorney–client relationship
                is formed only through a signed engagement agreement with a licensed lawyer.
              </p>
            </Block>

            <Block icon={<BookOpen className="w-6 h-6 text-blue-600" />} title="Accuracy & Completeness">
              <p>
                While our editorial team strives to keep content accurate and up to date in accordance with our{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>,
                we make no warranties or representations as to the accuracy, completeness, or timeliness of any
                information on this site. Legal outcomes depend on the specific facts of each situation. Always
                consult a qualified attorney before acting on any information found here.
              </p>
            </Block>

            <Block icon={<ExternalLink className="w-6 h-6 text-blue-600" />} title="External Links & Third Parties">
              <p>
                This website may contain links to third-party websites and references to third-party practitioners
                or services. Such links and references are provided for convenience only. We do not endorse,
                control, or assume responsibility for the content, accuracy, or practices of any third party.
                Any decision to engage a lawyer or service listed or referenced on this site is made at your own
                discretion and risk.
              </p>
            </Block>

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="Professional Advice">
              <p>
                Legal, financial, tax, and regulatory matters are fact-specific. Nothing on this website
                constitutes legal, financial, tax, or other professional advice. You should seek advice from a
                licensed professional who can consider the particulars of your situation before making any decision.
              </p>
            </Block>

            <Block icon={<AlertTriangle className="w-6 h-6 text-blue-600" />} title="Advertising Disclosure">
              <p>
                Law Elite Network is supported in part by advertising, including ads served by third-party
                networks such as Google AdSense. Advertisements are clearly distinguishable from editorial
                content, and the presence of an advertisement does not constitute an endorsement. Our editorial
                decisions are made independently of any advertising relationship. See our{' '}
                <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> for
                how advertising cookies are used.
              </p>
            </Block>

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="Limitation of Liability">
              <p>
                To the fullest extent permitted by law, Law Elite Network and its owners, editors, contributors,
                and affiliates shall not be liable for any loss or damage arising from your use of, or reliance
                on, any information provided on this website. Your use of the site is governed by our{' '}
                <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link>.
              </p>
            </Block>

            <Block icon={<BookOpen className="w-6 h-6 text-blue-600" />} title="Contact">
              <p>
                Questions about this disclaimer? Reach our Compliance Office at{' '}
                <a href="mailto:legal@lawelitenetwork.com" className="text-blue-600 hover:underline">legal@lawelitenetwork.com</a>.
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
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed pl-14">{children}</div>
    </div>
  );
}
