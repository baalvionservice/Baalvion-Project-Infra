
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
    { label: "Not Legal Advice", id: "not-advice" },
    { label: "Our Team", id: "team" },
    { label: "How We're Funded & Editorial Independence", id: "funding" },
    { label: "Standards, Corrections & Contact", id: "standards" },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20 pb-12 md:pt-32 md:pb-24">
        <div className="container mx-auto px-6 max-w-4xl">

          <header className="mb-8 md:mb-12">
            <h1 className="text-[32px] md:text-[56px] font-bold text-slate-900 tracking-tight font-serif mb-6 md:mb-10 leading-tight">
              About Us
            </h1>

            {/* HIGH-FIDELITY TABLE OF CONTENTS BOX */}
            <div className="relative border border-slate-200 p-5 pt-5 md:p-8 md:pt-6 rounded-none">
              <div className="flex items-center gap-2 mb-4 md:mb-6">
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
          <section className="space-y-10 md:space-y-16">

            <Block id="who-we-are" title="Who We Are">
              <p>
                Law Elite Network was founded on March 11, 2025 to explore the law from the outside in — its history,
                its language, the way it shows up in film and television, and how technology is changing how it's
                practiced and taught. We are a publication operated by <strong>Baalvion Industries Private
                Limited</strong> that covers law as history, culture, and society, not as a source of legal advice.
              </p>
              <p>
                Our readers come from all over the world: history and civics readers, law students, writers researching
                a courtroom scene, and anyone curious about where a legal word, symbol, or tradition actually came from.
                Our goal is the same for all of them — well-sourced, plainly written stories about the law, told for a
                general audience.
              </p>
            </Block>

            <Block id="mission" title="Our Mission">
              <p>
                Legal history and tradition are full of stories that rarely get told in plain language — why courts use
                the symbols they do, how legal language entered everyday English, how popular culture shapes what
                people believe about the justice system. Our mission is to tell those stories accurately and
                accessibly, for readers who are simply curious, not looking for legal advice.
              </p>
              <p>
                We are an editorial and educational publisher, not a law firm and not a lawyer-referral service. We
                don't advise on anyone's legal situation; we explain how the law came to be the way it is. Everything
                we publish is written with that distinction in mind.
              </p>
            </Block>

            <Block id="approach" title="Our Editorial Approach">
              <p>
                Every article on Law Elite Network is created to be accurate, well-sourced, and accessible. We write for
                the general reader, not the specialist, which means plain language over jargon and concrete historical
                or cultural detail over abstraction.
              </p>
              <p>
                Our coverage is organized around six sections:{' '}
                <Link href="/law-and-popular-culture">Law &amp; Popular Culture</Link>,{' '}
                <Link href="/history-and-civilization">History &amp; Civilization</Link>,{' '}
                <Link href="/language-and-literature">Language &amp; Literature</Link>,{' '}
                <Link href="/technology-and-digital-culture">Technology &amp; Digital Culture</Link>,{' '}
                <Link href="/law-culture-and-society">Law, Culture &amp; Society</Link>, and{' '}
                <Link href="/law-school-success">Law School Success</Link>. Within each, we aim for breadth that helps
                readers orient themselves, and depth where a topic genuinely warrants it.
              </p>
            </Block>

            <Block id="research" title="How Our Content Is Researched & Reviewed">
              <p>
                Our content is produced by a team of writers and editors who research each topic against primary and
                reputable secondary sources — historical records, court opinions, academic references, and reporting
                from established outlets. Drafts are edited for clarity and accuracy and reviewed before publication.
              </p>
              <p>
                History and culture are still living subjects — new scholarship, new rulings, and new cultural moments
                mean pieces get revisited and updated, and we date our pages so readers can see how current a piece is.
                The full details of this process are set out in our{' '}
                <Link href="/editorial-standards">Editorial Standards</Link>.
              </p>
            </Block>

            <Block id="not-advice" title="Not Legal Advice">
              <p>
                This is the most important thing we can tell you about our content:{' '}
                <strong>Law Elite Network is an educational and cultural publication. Nothing on this site is legal
                advice, and reading it does not create an attorney–client relationship of any kind.</strong>
              </p>
              <p>
                If you have an actual legal question or situation, consult a licensed attorney in your jurisdiction —
                we don't maintain a lawyer directory or referral service, and we don't connect readers with
                practitioners. See our <Link href="/terms-of-service">Terms of Service</Link> for the full notice.
              </p>
            </Block>

            <Block id="team" title="Our Team">
              <p>
                Our content is shaped by an editorial team of writers and desk editors who bring experience across the
                sections we cover. Named editors and contributors are responsible for researching, writing, and
                reviewing our material, and our standards apply uniformly to every member of the team.
              </p>
              <p>
                Law Elite Network is operated by Baalvion Industries Private Limited, which supports our editorial
                independence and gives our team the resources to maintain a growing library to a consistent standard.
              </p>
            </Block>

            <Block id="funding" title="How We're Funded & Editorial Independence">
              <p>
                Law Elite Network is a commercial publication, and we believe readers are entitled to know how that
                works. We generate revenue through display advertising and B2B sponsorship placements (see{' '}
                <Link href="/advertise">Advertise</Link>). We do not charge readers to access our guides, and we do not
                operate a lawyer directory or take referral fees of any kind.
              </p>
              <p>
                No advertiser or sponsor can buy editorial coverage or favorable mention in an article — commercial
                arrangements are handled separately from editorial judgments, which are governed solely by our{' '}
                <Link href="/editorial-standards">Editorial Standards</Link>. The full policy, including how writers
                and reviewers disclose relevant personal interests, is set out in our{' '}
                <Link href="/conflict-of-interest-policy">Conflict of Interest Policy</Link>; how sponsored content is
                labeled on the site itself is covered in our{' '}
                <Link href="/sponsored-content-policy">Sponsored Content Policy</Link>.
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
    <div id={id} className="space-y-4 md:space-y-6 scroll-mt-32">
      <h2 className="text-[22px] md:text-[32px] font-bold text-slate-900 font-serif leading-tight">{title}</h2>
      <div className="prose-legal max-w-none space-y-3 md:space-y-4 text-base md:text-lg text-slate-700 leading-relaxed font-medium [&_a]:text-blue-600 [&_a:hover]:underline [&_a]:decoration-blue-200 [&_a]:decoration-2 [&_a]:underline-offset-4">
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
