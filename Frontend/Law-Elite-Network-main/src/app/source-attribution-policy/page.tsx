import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { BookOpen, Gavel, Clock, AlertTriangle } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function SourceAttributionPolicyPage() {
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
              Source Attribution Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Trustworthy legal writing depends on being clear about where information comes from. This policy
              explains how we cite primary legal sources, how we distinguish them from our own commentary, and why
              the date on a legal article matters as much as its content.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Gavel className="w-6 h-6 text-blue-600" />} title="Primary Sources vs. Secondary Commentary">
              <p>
                Primary legal sources — statutes, regulations, case law, court filings, and regulatory guidance — are
                cited directly and, where possible, linked to the official or authoritative publication of that
                source. Our own explanations, summaries, and analysis of those sources are secondary commentary: our
                interpretation of what a primary source means and why it matters. We aim to make it clear, within an
                article, which sentences are describing what the law says and which are our editorial interpretation
                of it.
              </p>
            </Block>

            <Block icon={<BookOpen className="w-6 h-6 text-blue-600" />} title="What Counts as Authoritative">
              <p>
                We prioritize official government sources — court systems, legislatures, and regulatory agencies —
                over secondary aggregators when citing the underlying law. Where we rely on secondary legal
                databases or commentary, we prefer sources with a track record of accuracy and, per our{' '}
                <Link href="/editorial-process" className="text-blue-600 hover:underline">Editorial Process</Link>,
                subject significant claims to review by our editorial team before publication.
              </p>
            </Block>

            <Block icon={<Clock className="w-6 h-6 text-blue-600" />} title="Law Changes — Dates Matter">
              <p>
                Law is not static: it varies by jurisdiction and changes over time through new legislation, court
                decisions, and regulatory action. Every article displays when it was last substantively reviewed, and
                a citation to a statute or case is only as current as that date. Readers relying on time-sensitive
                legal information should confirm the current state of the law in their jurisdiction, particularly for
                older articles. See our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> page for how
                we handle updates when the underlying law changes.
              </p>
            </Block>

            <Block icon={<AlertTriangle className="w-6 h-6 text-blue-600" />} title="Information, Not Legal Advice">
              <p>
                Careful sourcing does not make our content a substitute for retaining counsel. Law Elite Network
                publishes legal information and education, not individualized legal advice, and citing a statute or
                case in an article is not a representation that it applies to any particular reader&apos;s situation.
                See our{' '}
                <Link href="/disclaimer" className="text-blue-600 hover:underline">Disclaimer</Link> for the full
                scope of this distinction, and use our{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">lawyer directory</Link> to find
                counsel for advice specific to your circumstances.
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
