import React from 'react';
import Link from 'next/link';

/**
 * Homepage "what is this platform" explainer -- states the education-vs-advice
 * distinction once, in plain prose, instead of scattering disclaimer language
 * across every section. Keep this in sync with the fuller version on
 * /about-us and /editorial-standards rather than expanding it here.
 */
export function PlatformIntro() {
  return (
    <section className="py-14 border-t border-slate-200">
      <div className="max-w-3xl">
        <span className="kicker">What We Do</span>
        <h2 className="font-headline text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 mt-2 mb-5">
          What Is Law Elite Network?
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
          <p>
            Law Elite Network is a legal-information and education platform created to make complex
            legal topics easier to understand. We organize legal information by subject and
            jurisdiction so readers can find relevant resources more easily.
          </p>
          <p>
            Law Elite Network provides general legal information for educational and research
            purposes. It is <strong className="text-slate-800">not a law firm</strong> and does not
            provide individualized legal advice or legal representation — see our full{' '}
            <Link href="/terms-of-service#disclaimers" className="text-blue-600 underline hover:text-blue-800">
              Legal Disclaimer
            </Link>
            . Our guides help you recognize what applies to your situation and prepare better
            questions for a conversation with counsel — the specifics of any real case still belong
            with a qualified, licensed lawyer in the relevant jurisdiction.
          </p>
        </div>
      </div>
    </section>
  );
}
