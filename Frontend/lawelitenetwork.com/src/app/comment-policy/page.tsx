import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { Ban, ShieldCheck, Flag } from 'lucide-react';

const LAST_UPDATED = 'July 5, 2026';

export default function CommentPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Community Standards</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Comment Policy
            </h1>
            <p className="text-sm font-medium text-slate-500">Last updated: {LAST_UPDATED}</p>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              Readers can comment on our articles. That space is valuable because it&apos;s honest, which is why we
              hold it to clear rules and moderate it actively.
            </p>
          </div>

          <section className="space-y-16">

            <Block icon={<Ban className="w-6 h-6 text-blue-600" />} title="What Is Not Allowed">
              <ul className="list-disc pl-6 space-y-2">
                <li>Harassment, threats, or targeted abuse directed at another reader or our staff;</li>
                <li>Defamatory claims presented as fact — including unsubstantiated accusations against a named
                  person or organization;</li>
                <li>Impersonation of another person, an organization, or a Law Elite Network staff member;</li>
                <li>Using the comment section to solicit business or advertise unrelated services;</li>
                <li>Spam, coordinated posting, or content unrelated to the article.</li>
              </ul>
            </Block>

            <Block icon={<ShieldCheck className="w-6 h-6 text-blue-600" />} title="Moderation Process">
              <p>
                Comments are subject to moderation both before and after publication. Content that violates this
                policy may be removed, edited to redact the violating portion, or, for repeat violations, result in
                the commenter losing the ability to post. Moderation decisions focus on whether a rule was broken,
                not on whether the underlying opinion was positive or negative — genuine, good-faith criticism is
                allowed even when it is unflattering.
              </p>
            </Block>

            <Block icon={<Flag className="w-6 h-6 text-blue-600" />} title="Reporting a Problem">
              <p>
                If you see a comment that appears to violate this policy — including one that looks fake, coerced,
                or defamatory — report it through our{' '}
                <Link href="/contact-us" className="text-blue-600 hover:underline">Contact Us</Link> page with a
                link to the content in question. We review reports and act on confirmed violations.
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
