import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Scale, Users, FileWarning, ShieldAlert } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function ConflictOfInterestPolicyPage() {
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
              Conflict of Interest Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Law Elite Network is a commercial publication funded by advertising and B2B sponsorship, and we manage
              the conflicts of interest that come with that explicitly, rather than leave them unaddressed.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="Separating Editorial and Commercial Judgment">
              <p>
                Advertising and sponsorship arrangements are commercial relationships, disclosed in our{' '}
                <Link href="/sponsored-content-policy" className="text-blue-600 hover:underline">Sponsored Content Policy</Link>.
                They are kept separate from editorial judgments about what we cover and how, which are governed by our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
                An advertiser&apos;s spend with us does not entitle them to favorable coverage, and declining to
                advertise does not result in unfavorable treatment in our editorial content.
              </p>
            </Block>

            <Block icon={<Users className="w-6 h-6 text-blue-600" />} title="Personal Disclosure by Writers and Reviewers">
              <p>
                Writers and reviewers are expected to disclose personal ties that are relevant to what they cover —
                for example, a financial interest in a company or public figure they are writing about, or any
                compensation received from a party discussed in an article. Where a relevant tie exists, we either
                disclose it alongside the content, reassign the coverage to another editor, or both, depending on the
                severity of the relationship.
              </p>
            </Block>

            <Block icon={<FileWarning className="w-6 h-6 text-blue-600" />} title="Sponsorship Does Not Buy Coverage">
              <p>
                No advertising spend or sponsorship fee entitles a company or individual to editorial coverage or
                favorable mention in an article. Editorial coverage decisions are made without regard to a party&apos;s
                commercial relationship with us, as described in our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
              </p>
            </Block>

            <Block icon={<ShieldAlert className="w-6 h-6 text-blue-600" />} title="Undisclosed Conflicts">
              <p>
                An undisclosed conflict of interest — whether involving a writer, an editor, or a commercial
                partnership that improperly influenced content — is grounds for a review of the affected content
                under our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> process, and
                may result in relabeling, correction, or removal of the material. If you believe a conflict has gone
                undisclosed, report it to{' '}
                <a href="mailto:corrections@lawelitenetwork.com" className="text-blue-600 hover:underline">corrections@lawelitenetwork.com</a>.
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
