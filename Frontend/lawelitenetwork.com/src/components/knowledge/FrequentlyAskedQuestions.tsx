import React from 'react';

/**
 * Renders the delineated FAQ section extracted by
 * `src/lib/seo/faq-section-extractor.ts` as a real accordion, using the
 * site's existing native `<details>/<summary>` disclosure pattern (see
 * PrimarySources.tsx) rather than a new UI dependency. Only shows questions
 * an editor actually wrote in a labeled FAQ section -- an article without
 * one simply renders nothing here (the FAQPage JSON-LD in article-seo.tsx
 * uses a separate, more permissive extractor and is unaffected).
 */
export function FrequentlyAskedQuestions({ pairs }: { pairs: { question: string; answer: string }[] }) {
  if (pairs.length === 0) return null;

  return (
    <section aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="font-headline text-2xl md:text-[2rem] font-extrabold text-slate-900 tracking-tight border-b border-slate-200 pb-3 mb-6">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100">
        {pairs.map((pair, i) => (
          <details key={i} className="group py-4">
            <summary className="cursor-pointer select-none list-none flex items-center justify-between gap-4 font-bold text-slate-900 text-[15px]">
              {pair.question}
              <span className="text-slate-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true">▾</span>
            </summary>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">{pair.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
