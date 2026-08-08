import React from 'react';

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
          An independent legal-education publisher
        </h2>
        <div className="space-y-4 text-[15px] leading-relaxed text-slate-600">
          <p>
            Law Elite Network explains what legal concepts, rights, procedures and terminology
            actually mean — in plain language, organized by topic and by jurisdiction, so you can
            understand a legal system before you have to navigate it.
          </p>
          <p>
            That's legal <em>education</em>, not individualized legal advice. Our guides help you
            recognize what applies to your situation and prepare better questions for a
            conversation with counsel — the specifics of any real case still belong with a
            qualified, licensed lawyer in the relevant jurisdiction.
          </p>
        </div>
      </div>
    </section>
  );
}
