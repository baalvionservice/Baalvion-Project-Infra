import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Accessibility, Wrench, MessageSquareWarning, PuzzleIcon } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function AccessibilityPage() {
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
              Accessibility Statement
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Legal information should be usable by everyone, including readers who rely on assistive technology.
              Law Elite Network is committed to providing a website that is accessible to the widest possible
              audience, regardless of ability or the technology used to browse it.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Accessibility className="w-6 h-6 text-blue-600" />} title="Our Standard">
              <p>
                We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.2 at Level AA across our core
                pages, including our article pages and lawyer directory. This
                includes attention to color contrast, keyboard navigation, semantic heading structure, descriptive
                link text, and alternative text for meaningful images.
              </p>
            </Block>

            <Block icon={<Wrench className="w-6 h-6 text-blue-600" />} title="Ongoing Improvement">
              <p>
                Accessibility is not a one-time project; it is an ongoing part of how we build and maintain the
                site. As we publish new features, redesign templates, or add tools such as appointment scheduling,
                we review
                them against our accessibility standard and correct issues as they are identified, in the same spirit
                as our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> process for
                editorial content.
              </p>
            </Block>

            <Block icon={<PuzzleIcon className="w-6 h-6 text-blue-600" />} title="Third-Party Content">
              <p>
                Some parts of the site incorporate third-party embedded tools, such as lawyer directory widgets,
                scheduling components, or advertising placements. These components are built and maintained outside
                our direct control, and may at times lag behind full conformance with our accessibility standard. We
                work with vendors to address known issues and prioritize accessible alternatives where a suitable
                option is not yet available.
              </p>
            </Block>

            <Block icon={<MessageSquareWarning className="w-6 h-6 text-blue-600" />} title="Reporting a Barrier">
              <p>
                If you encounter a barrier using Law Elite Network — a page that does not work with a screen reader,
                a control that cannot be reached by keyboard, or text that is difficult to read — please tell us.
                Email{' '}
                <a href="mailto:accessibility@lawelitenetwork.com" className="text-blue-600 hover:underline">accessibility@lawelitenetwork.com</a>{' '}
                or reach us through{' '}
                <Link href="/contact-us" className="text-blue-600 hover:underline">Contact Us</Link>, including the
                page URL, the assistive technology or browser you were using, and a description of the problem. We
                review every report and prioritize fixes based on impact.
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
