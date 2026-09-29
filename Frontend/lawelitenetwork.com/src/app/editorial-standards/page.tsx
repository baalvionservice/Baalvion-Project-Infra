"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, BookOpen, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'June 30, 2026';

export default function EditorialStandardsPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Our Editorial Promise", id: "promise" },
    { label: "How Articles Are Researched", id: "research" },
    { label: "Sourcing Standards", id: "sourcing" },
    { label: "How Articles Are Written", id: "writing" },
    { label: "Fact-Checking & Review", id: "fact-checking" },
    { label: "Who Reviews Our Work", id: "reviewers" },
    { label: "Update Cadence & Dating", id: "updates" },
    { label: "General Information, Not Legal Advice", id: "not-advice" },
    { label: "Independence & Advertising", id: "independence" },
    { label: "Corrections & Contact", id: "corrections" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Trust & Transparency</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Editorial Standards
            </h1>
            <p className="text-sm font-medium text-slate-500 mb-10">Last updated: {LAST_UPDATED}</p>

            <div className="relative border border-slate-200 p-8 pt-6 rounded-none bg-slate-50/30">
              <div className="flex items-center gap-2 mb-6">
                <List className="w-4 h-4 text-blue-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-900">Table of Contents</span>
              </div>

              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 animate-in fade-in duration-300">
                  {tocLinks.map((link) => (
                    <div key={link.id} className="flex items-start gap-2 group">
                      <CoralArrow className="mt-1 shrink-0" />
                      <Link
                        href={`#${link.id}`}
                        className="text-[15px] font-medium text-slate-800 hover:text-blue-600 underline decoration-slate-200 hover:decoration-blue-600 decoration-1 underline-offset-4 transition-all"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#a3a3a3] hover:bg-slate-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-sm transition-all shadow-sm"
              >
                {isExpanded ? 'Close -' : 'Expand +'}
              </button>
            </div>
          </header>

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16 flex items-start gap-5">
            <BookOpen className="w-8 h-8 text-blue-600 shrink-0 mt-1" />
            <p className="text-slate-700 leading-relaxed">
              Law Elite Network publishes stories about the history, language, popular-culture portrayal, and
              technology of law for a general audience. Because historical and legal facts matter, we hold our
              content to documented standards for research, sourcing, accuracy, and transparency. This page explains
              exactly how our articles are made.
            </p>
          </div>

          <section className="space-y-16">

            <Block id="promise" title="Our Editorial Promise">
              <p>
                We promise our readers four things: that our content is researched against authoritative sources, that
                it is reviewed for accuracy before it is published, that it is kept current and clearly dated, and
                that we are always honest about the difference between general legal information and legal advice.
                Every standard described below exists to keep that promise.
              </p>
            </Block>

            <Block id="research" title="How Articles Are Researched">
              <p>
                Each article begins with real research, not a summary of someone else&apos;s summary. Our writers
                identify the historical record, primary legal texts, and — where relevant — reporting and scholarship
                on the topic, and map how those sources fit together before writing a single explanatory sentence.
              </p>
              <p>
                Because our coverage spans many countries and legal traditions, research also means identifying which
                tradition a topic belongs to and flagging where the history or practice differs across countries or
                regions, rather than papering over the differences with a single generic account.
              </p>
            </Block>

            <Block id="sourcing" title="Sourcing Standards">
              <p>We prioritize sources in the following order:</p>
              <ul>
                <li><strong>Primary sources</strong> — statutes, court opinions, historical records, and original documents.</li>
                <li><strong>Official records</strong> — publications from courts, archives, and government or academic institutions.</li>
                <li><strong>Reputable secondary sources</strong> — established references, academic scholarship, and recognized journalism, used to explain or contextualize the primary record.</li>
              </ul>
              <p>
                We avoid relying on unverified or anonymous sources, and we do not present marketing material as if it
                were neutral authority. When we state a fact, that statement is grounded in a source we have checked.
              </p>
            </Block>

            <Block id="writing" title="How Articles Are Written">
              <p>
                Our house style favors plain language. We write for a reader who is trying to understand a topic for
                the first time: we define terms of art, prefer concrete examples to abstraction, and structure
                articles so a reader can find the specific point they need.
              </p>
              <p>
                We aim for balance and accuracy over persuasion. Where the history is unsettled, contested, or
                fact-specific, we say so rather than implying a certainty that does not exist.
              </p>
            </Block>

            <Block id="fact-checking" title="Fact-Checking & Review">
              <p>
                Before publication, every article is checked against its sources. Editors verify that claims are
                supported by the cited authority, that dates and figures are accurate, and that nothing in the piece
                reads as individualized legal advice. Articles that are fact-specific receive additional review by an
                editor with subject-matter familiarity in that area.
              </p>
              <p>
                Fact-checking is not a one-time event. When new scholarship, rulings, or developments surface, the
                affected content is re-checked and corrected as part of our ongoing update process.
              </p>
            </Block>

            <Block id="reviewers" title="Who Reviews Our Work">
              <p>
                Our content is produced and reviewed by a team of writers, editors, and contributors with experience
                across the sections we cover. Named editors are accountable for the accuracy of the material in their
                sections, and our review standards apply uniformly to every contributor. You can learn more about our
                team on our <Link href="/about-us">About Us</Link> page.
              </p>
            </Block>

            <Block id="updates" title="Update Cadence & Dating">
              <p>
                History and culture are still living subjects, and content that is not maintained becomes misleading.
                We review our material on a recurring schedule and whenever new scholarship, a relevant ruling, or a
                cultural development comes to our attention. Every page carries a clear &quot;last updated&quot; date
                so readers can judge how current it is, and substantive changes are reflected in that date.
              </p>
            </Block>

            <Block id="not-advice" title="General Information, Not Legal Advice">
              <div className="not-prose mb-6 border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl p-6 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-slate-700 m-0">
                  Our content is general legal and historical information for educational purposes only. It is not
                  legal advice, and it does not create an attorney–client relationship.
                </p>
              </div>
              <p>
                No article can account for the specific facts of your situation. We write to inform and explain,
                never to substitute for advice from a licensed attorney who knows your circumstances. This policy is
                reflected throughout our content and explained in full in our{' '}
                <Link href="/terms-of-service">Terms of Service</Link>.
              </p>
            </Block>

            <Block id="independence" title="Independence & Advertising">
              <p>
                Law Elite Network is a free publication that may be supported in part by advertising, including
                through third-party networks such as Google AdSense, to help fund our content. Our editorial decisions
                are made independently of any advertising or commercial relationship. Where advertising appears, it is
                clearly distinguishable from editorial content, and the presence of an advertiser never influences
                whether or how we cover a topic. Where content is sponsored or commercial in nature, we label it as
                such.
              </p>
            </Block>

            <Block id="corrections" title="Corrections & Contact">
              <p>
                We take accuracy seriously, and we correct mistakes promptly and transparently. If you believe something
                we have published is inaccurate or out of date, please tell us — our{' '}
                <Link href="/corrections">Corrections</Link> policy explains how to report an error and how we handle and
                timestamp fixes. For editorial questions or feedback, contact us at{' '}
                <a href="mailto:editorial@lawelitenetwork.com">editorial@lawelitenetwork.com</a> or through our{' '}
                <Link href="/contact-us">Contact</Link> page.
              </p>
            </Block>

          </section>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="space-y-6 scroll-mt-32">
      <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      <div className="prose-legal max-w-none space-y-4 text-slate-700 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_a]:text-blue-600 [&_a:hover]:underline">
        {children}
      </div>
    </div>
  );
}

function CoralArrow({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4 text-[#ff6b6b]", className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 15l-3 3-3-3" /><path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
