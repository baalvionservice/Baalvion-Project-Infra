import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Copyright, BookOpen, Ban, Mail } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function CopyrightPolicyPage() {
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
              Copyright Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              This Copyright Policy explains who owns the content published on Law Elite Network, what you may do
              with it, and how to request permission for uses beyond what is already allowed. It is distinct from our{' '}
              <Link href="/dmca-policy" className="text-blue-600 hover:underline">DMCA Policy</Link>, which governs
              takedown notices for alleged infringement — this page describes our ownership position and licensing
              terms directly.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Copyright className="w-6 h-6 text-blue-600" />} title="What We Own">
              <p>
                The original text on Law Elite Network — including our case summaries, legal explainers, editorial
                commentary, headlines, illustrations, and site design — is owned by Law Elite Network or licensed to
                us by our contributors, and is protected under applicable copyright law. This ownership covers our{' '}
                <em>original expression</em>: the way we research, structure, summarize, and explain a legal topic.
              </p>
            </Block>

            <Block icon={<BookOpen className="w-6 h-6 text-blue-600" />} title="Public Domain Sources vs. Our Commentary">
              <p>
                Statutes, regulations, and judicial opinions are generally in the public domain in the United States
                and are not owned by anyone, including us. What is protected is our original analysis: the summary we
                write about a case, the plain-language explanation of a statute, or the structure and selection of
                information in an encyclopedia entry. Reproducing the underlying public-domain law is not a copyright
                concern; reproducing our original write-up of it, without permission, is.
              </p>
            </Block>

            <Block icon={<Ban className="w-6 h-6 text-blue-600" />} title="Permitted and Prohibited Use">
              <p>
                Readers, journalists, and researchers may quote brief excerpts of our original content for commentary,
                criticism, or reference, provided the excerpt is reasonably short, is clearly attributed to Law Elite
                Network, and links back to the original page. This kind of fair, attributed quotation does not require
                separate permission.
              </p>
              <p>
                What is not permitted without a license: automated scraping or bulk downloading of our articles,
                mirroring substantial portions of our encyclopedia on another site or service, republishing full
                articles under a different byline, or using our content to train other publications&apos; datasets or
                products without a separate agreement.
              </p>
            </Block>

            <Block icon={<Mail className="w-6 h-6 text-blue-600" />} title="Requesting Permission">
              <p>
                If you would like to license, republish, or use our content beyond what is described above, email{' '}
                <a href="mailto:permissions@lawelitenetwork.com" className="text-blue-600 hover:underline">permissions@lawelitenetwork.com</a>{' '}
                with the specific article, the intended use, and where it would appear. For copyright infringement
                claims rather than permission requests, see our{' '}
                <Link href="/dmca-policy" className="text-blue-600 hover:underline">DMCA Policy</Link>. General
                questions can also be routed through our{' '}
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
