import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Users, Globe2, BookOpen, Scale } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function DiversityPolicyPage() {
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
              Diversity Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              The law touches every community differently. Law Elite Network is committed to representing a broad
              range of practice areas, jurisdictions, and voices in our legal commentary, and to making that
              commentary genuinely useful to readers regardless of their background or prior familiarity with the
              legal system.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Globe2 className="w-6 h-6 text-blue-600" />} title="Breadth of Practice Areas and Jurisdictions">
              <p>
                Our practice-area guides span business and corporate law to criminal law, family law, tax, employment, and
                technology, reflecting the reality that readers arrive with very different legal needs. Where law
                varies meaningfully by jurisdiction, we aim to note that variation rather than present a single
                jurisdiction&apos;s rule as universal.
              </p>
            </Block>

            <Block icon={<Users className="w-6 h-6 text-blue-600" />} title="Diverse Voices in Our Directory and Contributors">
              <p>
                We aim for our{' '}
                <Link href="/lawyers" className="text-blue-600 hover:underline">lawyer directory</Link> and our{' '}
                <Link href="/authors" className="text-blue-600 hover:underline">contributor roster</Link> to reflect
                the diversity of the legal profession itself, across practice focus, firm size, geography, and
                background. Verification and inclusion criteria are applied consistently to every applicant,
                regardless of these characteristics, under our{' '}
                <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
              </p>
            </Block>

            <Block icon={<BookOpen className="w-6 h-6 text-blue-600" />} title="Accessible Legal Explanations">
              <p>
                Legal writing can be dense and exclusionary by default. We write our explainers and encyclopedia
                entries in plain language wherever the underlying law allows it, so that a reader with no legal
                training can follow the core concepts, while still preserving the precision needed for the
                information to be useful and accurate.
              </p>
            </Block>

            <Block icon={<Scale className="w-6 h-6 text-blue-600" />} title="An Ongoing Commitment">
              <p>
                We treat representation and accessibility as ongoing goals rather than a box to check once. As our
                coverage grows, we look for gaps in practice areas, jurisdictions, and perspectives, and prioritize
                closing them. Readers who notice an underrepresented topic or community in our coverage are welcome
                to raise it through our{' '}
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
        <h2 className="text-[22px] md:text-[28px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      </div>
      <div className="prose-legal max-w-none text-slate-700 leading-relaxed space-y-4 pl-14">{children}</div>
    </div>
  );
}
