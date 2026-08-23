"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List, Search, PenLine, CheckCircle2, RefreshCcw, Users, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LAST_UPDATED = 'August 10, 2026';

export default function EditorialProcessPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "How a Guide Gets Made", id: "steps" },
    { label: "Research & Sourcing", id: "sourcing" },
    { label: "Writing & Drafting", id: "writing" },
    { label: "Fact-Checking & Review", id: "fact-checking" },
    { label: "The Editorial Team", id: "team" },
    { label: "Keeping Content Current", id: "updates" },
    { label: "Ethical Conduct", id: "ethics" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-600 bg-blue-50 px-2 py-1 rounded">Trust &amp; Transparency</span>
            </div>
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-3 leading-tight">
              Editorial Process
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

          <div className="border-l-4 border-blue-600 bg-slate-50 rounded-r-2xl p-8 mb-16">
            <p className="text-slate-700 leading-relaxed">
              This page walks through the concrete steps a guide goes through before it publishes on Law
              Elite Network — as distinct from our{' '}
              <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>,
              which sets out the rules those steps follow.
            </p>
          </div>

          <section className="space-y-16">

            <div id="steps" className="space-y-8">
              <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">How a Guide Gets Made</h2>
              <div className="space-y-6">
                <Step icon={<Search className="w-5 h-5" />} title="1. Research & Sourcing" desc="The relevant statutes, regulations, and case law are identified for the jurisdiction the piece addresses, and the topic is mapped against official and reputable secondary sources." />
                <Step icon={<PenLine className="w-5 h-5" />} title="2. Drafting" desc="A writer produces a plain-language draft. AI tools may assist with outlining or summarizing source material, but the draft itself is written and shaped by a human." />
                <Step icon={<CheckCircle2 className="w-5 h-5" />} title="3. Fact-Checking & Edit" desc="An editor checks every legal statement against its source, verifies jurisdiction labels and dates, and edits for clarity before the piece is approved to publish." />
                <Step icon={<RefreshCcw className="w-5 h-5" />} title="4. Ongoing Review" desc={'Published guides are revisited on a recurring schedule and whenever a relevant law changes, with the "Last Updated" date reflecting substantive revisions.'} />
              </div>
            </div>

            <Block id="sourcing" title="Research & Sourcing">
              <p>
                Writers research each topic against primary sources first — statutes, regulations, and
                court decisions — supplemented by official agency guidance and reputable secondary
                references. Because our coverage is worldwide, research also means correctly identifying
                which jurisdiction a question belongs to. The full sourcing hierarchy we follow is set out
                in our <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link>.
              </p>
            </Block>

            <Block id="writing" title="Writing & Drafting">
              <p>
                Guides are written in plain language for a reader encountering the topic for the first
                time, with jargon defined and the moments where a reader should consult a licensed
                attorney signposted explicitly.
              </p>
            </Block>

            <Block id="fact-checking" title="Fact-Checking & Review">
              <p>
                Before publication, an editor checks the draft against its cited sources: that legal
                statements are supported by the authority cited, that jurisdiction labels are correct, and
                that nothing reads as individualized legal advice. A citation or claim that cannot be
                verified against a real, checkable source is removed rather than published on the
                assumption that it is probably correct.
              </p>
            </Block>

            <Block id="team" title="The Editorial Team">
              <p>
                Guides are produced and reviewed by Law Elite Network&apos;s editorial team — writers and
                editors organized by practice area, credited on each guide and listed on our{' '}
                <Link href="/authors" className="text-blue-600 hover:underline">Contributors</Link> page.
                We do not currently claim review by licensed attorneys for any specific guide; where a
                piece has been reviewed by a named legal professional, that will be stated explicitly and
                accurately on the article itself, not implied generally. This is a deliberate choice: we
                would rather be precise about who reviewed a piece than use vague language that overstates
                it.
              </p>
            </Block>

            <Block id="updates" title="Keeping Content Current">
              <p>
                The law changes, so published guides are not left static. We revisit content on a
                recurring schedule and whenever a relevant statute, regulation, or major decision comes to
                our attention. Substantive corrections are reflected in the page&apos;s &quot;Last
                Updated&quot; date — see our{' '}
                <Link href="/corrections" className="text-blue-600 hover:underline">Corrections</Link> policy
                for how readers can flag an error.
              </p>
            </Block>

            <Block id="ethics" title="Ethical Conduct">
              <p>
                Editorial judgments are made independently of advertising, sponsorship, and any referral
                relationship in our lawyer directory — see our{' '}
                <Link href="/conflict-of-interest-policy" className="text-blue-600 hover:underline">Conflict of Interest Policy</Link>{' '}
                and{' '}
                <Link href="/editorial-disclosure-policy" className="text-blue-600 hover:underline">Editorial, DMCA &amp; Disclosure Policy</Link>.
                Contributors are expected to disclose personal ties to the legal industry relevant to what
                they cover.
              </p>
            </Block>

          </section>

          <div className="mt-16 flex items-start gap-3 text-slate-400 border-t border-slate-100 pt-8">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed">
              This process describes general legal education content, not legal advice. See our{' '}
              <Link href="/terms-of-service" className="text-blue-600 hover:underline">Terms of Service</Link> for
              the full notice, and our{' '}
              <Link href="/editorial-standards" className="text-blue-600 hover:underline">Editorial Standards</Link> for
              the standards this process is designed to meet.
            </p>
          </div>

        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function Step({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 shrink-0 shadow-inner border border-slate-100">{icon}</div>
      <div className="space-y-1">
        <h4 className="text-lg font-bold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-500 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="space-y-6 scroll-mt-32">
      <h2 className="text-[26px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      <div className="prose-legal max-w-none space-y-4 text-slate-700 leading-relaxed [&_a]:text-blue-600 [&_a:hover]:underline">
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
