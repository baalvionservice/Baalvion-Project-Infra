import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Scale, FileWarning, Undo2, ShieldAlert } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function DmcaPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Legal & Compliance</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              DMCA Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Law Elite Network respects the intellectual property rights of others and expects our contributors and
              readers to do the same. Because we publish case summaries, court filings, and legal commentary, we take
              copyright notice-and-takedown requests under 17 U.S.C. § 512 (the Digital Millennium Copyright Act)
              seriously and respond to valid notices promptly.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<FileWarning className="w-6 h-6 text-blue-600" />} title="Filing a Takedown Notice">
              <p>
                If you believe content hosted on Law Elite Network infringes a copyright you own or control, you may
                submit a written DMCA notice to our designated agent. To be effective under 17 U.S.C. § 512(c)(3), your
                notice must include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>A physical or electronic signature of the copyright owner or a person authorized to act on their behalf;</li>
                <li>Identification of the copyrighted work claimed to have been infringed;</li>
                <li>Identification of the material you claim is infringing, with enough detail (such as the URL) for us to locate it;</li>
                <li>Your contact information, including address, telephone number, and email address;</li>
                <li>A statement that you have a good-faith belief that the use is not authorized by the copyright owner, its agent, or the law;</li>
                <li>A statement, made under penalty of perjury, that the information in the notice is accurate and that you are authorized to act on behalf of the owner.</li>
              </ul>
              <p>
                Notices that omit required elements may delay processing. Notices concerning our own original commentary
                and summaries — as opposed to public-domain primary sources — should also reference our{' '}
                <Link href="/copyright-policy" className="text-blue-600 hover:underline">Copyright Policy</Link>.
              </p>
            </Block>

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="Designated DMCA Agent">
              <p>
                Our designated agent for notice of claimed infringement can be reached at{' '}
                <a href="mailto:dmca@lawelitenetwork.com" className="text-blue-600 hover:underline">dmca@lawelitenetwork.com</a>.
                Full legal name and mailing address for our registered agent:
              </p>
              <p className="font-medium text-slate-900">
                Copyright Compliance Officer, Legal Department, Baalvion Industries Private
                Limited — Yeshwant Avenue Building, NX, NX Road, Y K Nagar, Virar West, Virar,
                Maharashtra 401303, India
              </p>
            </Block>

            <Block icon={<Undo2 className="w-6 h-6 text-blue-600" />} title="Counter-Notification">
              <p>
                If material you submitted was removed or disabled in response to a takedown notice and you believe this
                was done in error or misidentification, you may submit a counter-notification to the same address
                above. A valid counter-notification must include your name, address, and phone number; identification
                of the removed material and its former location; a statement under penalty of perjury that you have a
                good-faith belief the material was removed by mistake or misidentification; and your consent to the
                jurisdiction of the federal court in your district (or, if outside the United States, any judicial
                district in which we may be found). Upon receipt of a valid counter-notification, we follow the
                timelines set out in 17 U.S.C. § 512(g) before deciding whether to restore the material.
              </p>
            </Block>

            <Block icon={<ShieldAlert className="w-6 h-6 text-blue-600" />} title="Repeat Infringer Policy">
              <p>
                Consistent with the DMCA, we maintain a policy of terminating, in appropriate circumstances, the
                accounts of contributors or users who are determined to be repeat infringers. We reserve the right to
                remove content that is the subject of a takedown notice pending review, without regard to whether that
                content is ultimately determined to be infringing.
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
