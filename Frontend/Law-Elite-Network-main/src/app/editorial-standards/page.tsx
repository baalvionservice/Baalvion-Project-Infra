"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, BookOpen, ShieldCheck, Cpu } from 'lucide-react';
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
    { label: "Use of AI Tooling", id: "ai" },
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
              Law Elite Network publishes legal information that readers around the world rely on to orient themselves
              and decide when to seek professional help. Because the law is a high-stakes subject, we hold our content to
              documented standards for research, sourcing, accuracy, and transparency. This page explains exactly how our
              articles are made.
            </p>
          </div>

          <section className="space-y-16">

            <Block id="promise" title="Our Editorial Promise">
              <p>
                We promise our readers four things: that our content is researched against authoritative sources, that it
                is reviewed for accuracy before it is published, that it is kept current and clearly dated, and that we
                are always honest about the difference between general legal information and personalized legal advice.
                Every standard described below exists to keep that promise.
              </p>
            </Block>

            <Block id="research" title="How Articles Are Researched">
              <p>
                Each article begins with research into the relevant law, not a summary of someone else&apos;s summary. Our
                writers identify the governing statutes, regulations, rules, and — where relevant — leading court
                decisions and official agency guidance for the jurisdiction the article addresses. We map how those
                authorities fit together before writing a single explanatory sentence.
              </p>
              <p>
                Because our coverage is worldwide, research also means identifying which jurisdiction a question belongs
                to and flagging where the answer differs across countries or regions. When a topic spans multiple legal
                systems, we make those distinctions explicit rather than papering over them with a single generic answer.
              </p>
            </Block>

            <Block id="sourcing" title="Sourcing Standards">
              <p>We prioritize sources in the following order:</p>
              <ul>
                <li><strong>Primary law</strong> — statutes, codes, regulations, constitutional provisions, and binding court decisions.</li>
                <li><strong>Official guidance</strong> — publications from courts, regulators, and government agencies that administer the law in question.</li>
                <li><strong>Reputable secondary sources</strong> — established legal references, bar association materials, and recognized scholarship, used to explain or contextualize the primary law.</li>
              </ul>
              <p>
                We avoid relying on unverified or anonymous sources, and we do not present marketing material as if it
                were neutral legal authority. When we describe what the law requires, that statement is grounded in a
                source we have checked.
              </p>
            </Block>

            <Block id="writing" title="How Articles Are Written">
              <p>
                Our house style favors plain language. We write for a reader who is trying to understand a topic for the
                first time: we define terms of art, prefer concrete examples to abstraction, and structure articles so a
                reader can find the specific point they need. Crucially, we signpost the moments where a reader should
                stop relying on a general explanation and consult a licensed professional about their own facts.
              </p>
              <p>
                We aim for balance and accuracy over persuasion. Where the law is unsettled, contested, or fact-specific,
                we say so rather than implying a certainty that does not exist.
              </p>
            </Block>

            <Block id="fact-checking" title="Fact-Checking & Review">
              <p>
                Before publication, every article is checked against its sources. Editors verify that legal statements
                are supported by the cited authority, that jurisdiction labels are correct, that dates and figures are
                accurate, and that nothing in the piece could be mistaken for individualized legal advice. Articles that
                are fact-specific or that carry meaningful risk to readers receive additional review by an editor with
                subject-matter familiarity in that area.
              </p>
              <p>
                Fact-checking is not a one-time event. When the underlying law changes, the affected content is
                re-checked and corrected as part of our ongoing update process.
              </p>
            </Block>

            <Block id="reviewers" title="Who Reviews Our Work">
              <p>
                Our content is produced and reviewed by a team of legal writers, editors, and contributors with
                experience across the practice areas we cover. Named legal editors are accountable for the accuracy of
                the material in their areas, and our review standards apply uniformly to every contributor. Where a topic
                warrants it, we draw on reviewers with deeper familiarity in the relevant field to confirm that an
                explanation is fair, current, and clearly stated. You can learn more about our team on our{' '}
                <Link href="/about-us">About Us</Link> page.
              </p>
            </Block>

            <Block id="updates" title="Update Cadence & Dating">
              <p>
                The law changes, and content that is not maintained becomes misleading. We review our material on a
                recurring schedule and whenever a significant legal development comes to our attention — a new statute, an
                amendment, a major decision, or revised official guidance. Every page carries a clear &quot;last
                updated&quot; date so readers can judge how current it is, and substantive changes are reflected in that
                date.
              </p>
            </Block>

            <Block id="ai" title="Use of AI Tooling">
              <div className="not-prose mb-6 p-6 rounded-2xl border border-slate-200 bg-white shadow-sm flex items-start gap-4">
                <Cpu className="w-6 h-6 text-blue-600 shrink-0" />
                <p className="text-sm text-slate-600 italic m-0">
                  Automation supports our editors. It never replaces their judgment, and no AI-generated text reaches a
                  reader without human review and verification.
                </p>
              </div>
              <p>
                We may use AI-assisted tools to help with tasks such as research triage, outlining, summarizing source
                material, or improving readability. Where we do, the output is treated as a draft input, not a finished
                product. A human editor reviews and verifies every such contribution against authoritative sources before
                it is published, and our sourcing, fact-checking, and accountability standards apply in full. We do not
                publish unreviewed machine-generated content, and the responsibility for what we publish always rests with
                our editorial team.
              </p>
            </Block>

            <Block id="not-advice" title="General Information, Not Legal Advice">
              <div className="not-prose mb-6 border-l-4 border-amber-500 bg-amber-50 rounded-r-2xl p-6 flex items-start gap-4">
                <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                <p className="text-slate-700 m-0">
                  Our content is general legal information for educational purposes only. It is not legal advice, and it
                  does not create an attorney–client relationship.
                </p>
              </div>
              <p>
                No article can account for the specific facts of your situation, your jurisdiction, or how the law would
                actually be applied to you. We write to inform and orient, never to substitute for advice from a licensed
                attorney who knows your circumstances. This policy is reflected throughout our content and explained in
                full in our <Link href="/disclaimer">Disclaimer</Link>.
              </p>
            </Block>

            <Block id="independence" title="Independence & Advertising">
              <p>
                Law Elite Network is supported in part by advertising, including ads served by third-party networks such
                as Google AdSense. Our editorial decisions are made independently of any advertising or commercial
                relationship. Advertisements are clearly distinguishable from editorial content, and the presence of an
                advertiser never influences whether or how we cover a topic. Where content is sponsored or commercial in
                nature, we label it as such.
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
      <h2 className="text-[32px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
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
