
"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/navbar';
import { PublicFooter } from '@/components/knowledge/PublicFooter';
import { List } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview High-Fidelity "About Us" Page
 * Precisely mirrors the Investopedia reference design with multi-column TOC and coral arrow signatures.
 */
export default function AboutUsPage() {
  const [isExpanded, setIsExpanded] = useState(true);

  const tocLinks = [
    { label: "Who We Are", id: "who-we-are" },
    { label: "Our Mission", id: "mission" },
    { label: "Our Editorial Approach", id: "approach" },
    { label: "How Our Content Is Researched & Reviewed", id: "research" },
    { label: "Worldwide, Multi-Jurisdiction Scope", id: "scope" },
    { label: "General Information, Not Legal Advice", id: "not-advice" },
    { label: "Our Team", id: "team" },
    { label: "Standards, Corrections & Contact", id: "standards" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-32 pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-12">
            <h1 className="text-[44px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-10 leading-tight">
              About Us
            </h1>

            {/* HIGH-FIDELITY TABLE OF CONTENTS BOX */}
            <div className="relative border border-slate-200 p-8 pt-6 rounded-none">
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

              {/* THE "CLOSE -" / "EXPAND +" BUTTON OVERLAY */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-[#a3a3a3] hover:bg-slate-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-sm transition-all shadow-sm"
              >
                {isExpanded ? 'Close -' : 'Expand +'}
              </button>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <section className="space-y-16">

            <Block id="who-we-are" title="Who We Are">
              <p>
                Law Elite Network was founded in 2011 with the mission of helping people understand the law and improve
                their professional and legal outcomes. We are a legal knowledge platform — part of the{' '}
                <Link href="/">Elite Knowledge Group</Link> publishing family — that publishes clear, well-sourced legal
                explainers and operates a directory through which readers can discover qualified practitioners.
              </p>
              <p>
                Our readers come to us from all over the world and from all walks of life. Some are encountering a legal
                question for the first time — a tenancy dispute, an employment issue, a question about starting a
                business — while others are experienced business owners, in-house teams, and professionals who want a
                fast, reliable refresher on an unfamiliar area. No matter who they are or where they are, our goal is the
                same: to make the law more understandable, and to point people toward the right kind of qualified help.
              </p>
            </Block>

            <Block id="mission" title="Our Mission">
              <p>
                Legal information has historically been hard to find, harder to read, and often locked behind jargon or
                paywalls. Our mission is to change that. We exist to translate complex legal topics into plain,
                accurate, and genuinely useful explanations — so that anyone, regardless of background, can make better
                informed decisions about when and how to seek professional advice.
              </p>
              <p>
                Just as importantly, we are clear about our limits. We are an educational publisher, not a law firm. Our
                purpose is to inform and orient, never to replace the judgment of a licensed attorney who knows the
                facts of your specific situation. Everything we publish is written with that responsibility in mind.
              </p>
            </Block>

            <Block id="approach" title="Our Editorial Approach">
              <p>
                Every article on Law Elite Network is created to be accurate, balanced, and accessible. We write for the
                reader who is trying to understand a topic, not for the specialist who already does. That means we favor
                plain language over Latin, concrete examples over abstraction, and explicit signposting toward the point
                at which a reader should consult a professional.
              </p>
              <p>
                Our coverage spans the areas of law that matter most in everyday life and in business — including
                business and corporate law, criminal law, family and personal matters, tax and finance, employment and
                labor, and technology and intellectual property. Within each area we aim for breadth that helps readers
                orient themselves, and depth where a topic genuinely warrants it.
              </p>
            </Block>

            <Block id="research" title="How Our Content Is Researched & Reviewed">
              <p>
                Our content is produced by a team of writers and editors who research each topic against primary sources
                — statutes, regulations, court decisions, and official government guidance — supplemented by reputable
                secondary references. Drafts are edited for clarity and accuracy and reviewed before publication. Where a
                topic is fact-specific or carries meaningful risk to readers, it receives additional scrutiny from
                editors with subject-matter familiarity.
              </p>
              <p>
                We treat the law as a living thing. Statutes are amended, cases are decided, and guidance is revised, so
                we revisit and update our material on a recurring basis and date our pages so readers can see how current
                a piece is. Where we use AI-assisted tooling to help with research or drafting, that output is always
                reviewed and verified by a human editor before it is published — automation supports our team, it does
                not replace its judgment. The full details of this process are set out in our{' '}
                <Link href="/editorial-standards">Editorial Standards</Link>.
              </p>
            </Block>

            <Block id="scope" title="Worldwide, Multi-Jurisdiction Scope">
              <p>
                Law Elite Network is a worldwide publication. Our library includes guides that explain how a given area
                of law works across many different countries and legal systems, because our readers live and do business
                across borders. A founder researching company formation, an employee questioning a contract, or a family
                navigating an international matter should be able to find a starting point here.
              </p>
              <p>
                Because the law varies so significantly from one jurisdiction to another — and even between regions
                within a single country — we are careful to identify the jurisdiction a piece of content addresses.
                Information that is accurate in one country may be incomplete or simply wrong in another. We encourage
                every reader to confirm how the relevant law applies in their own location with a locally licensed
                professional.
              </p>
            </Block>

            <Block id="not-advice" title="General Information, Not Legal Advice">
              <p>
                This is the most important thing we can tell you about our content:{' '}
                <strong>Law Elite Network provides general legal information for educational purposes only. It is not
                legal advice, and using our site does not create an attorney–client relationship.</strong>
              </p>
              <p>
                Legal outcomes turn on the specific facts of each situation, the jurisdiction involved, and how the law
                is applied to those facts. No article can account for the particulars of your circumstances. You should
                not act, or refrain from acting, on the basis of anything you read here without first obtaining advice
                from a qualified attorney licensed in your jurisdiction. Our commitment to accuracy is matched by our
                commitment to being honest about these limits — a standard we hold ourselves to in everything we
                publish. See our <Link href="/disclaimer">Disclaimer</Link> for the full notice.
              </p>
            </Block>

            <Block id="team" title="Our Team">
              <p>
                Our content is shaped by an editorial team of writers, legal editors, and contributors who bring
                experience across the practice areas we cover. Named legal editors and contributors are responsible for
                researching, writing, and reviewing our material, and our standards apply uniformly to every member of
                the team. We also work with reviewers who help ensure that what we publish is fair, current, and clearly
                explained.
              </p>
              <p>
                Law Elite Network is part of the <Link href="/">Elite Knowledge Group</Link> publishing family, which
                supports our editorial independence and gives our team the resources to maintain a large and growing
                library to a consistent standard.
              </p>
            </Block>

            <Block id="standards" title="Standards, Corrections & Contact">
              <p>
                We hold our work to documented standards and we welcome scrutiny. You can read exactly how we research,
                write, fact-check, and update our content in our{' '}
                <Link href="/editorial-standards">Editorial Standards</Link>. If you spot something that looks
                inaccurate or out of date, we want to hear about it — our{' '}
                <Link href="/corrections">Corrections</Link> policy explains how to report an error and how we handle and
                timestamp fixes.
              </p>
              <p>
                For anything else — questions, feedback, partnership inquiries, or press — please reach us through our{' '}
                <Link href="/contact-us">Contact</Link> page or by email at{' '}
                <a href="mailto:editorial@lawelitenetwork.com">editorial@lawelitenetwork.com</a>. We read everything our
                readers send, and it makes our work better.
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
      <div className="prose-legal max-w-none space-y-4 text-lg text-slate-700 leading-relaxed font-medium [&_a]:text-blue-600 [&_a:hover]:underline [&_a]:decoration-blue-200 [&_a]:decoration-2 [&_a]:underline-offset-4">
        {children}
      </div>
    </div>
  );
}

/**
 * Custom Coral Arrow SVG matching the reference image curved arrow
 */
function CoralArrow({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4 text-[#ff6b6b]", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 15l-3 3-3-3" />
      <path d="M12 18V9a3 3 0 0 1 3-3h3" />
    </svg>
  );
}
