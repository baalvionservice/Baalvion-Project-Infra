import React from "react";

export const homeFaqItems: { question: string; answer: string }[] = [
  {
    question: "What is Imperialpedia?",
    answer:
      "Imperialpedia is an independent financial education platform covering personal finance, stock market investing fundamentals, and the creator economy. It explains complex financial topics clearly, connects related concepts, and provides practical tools to help readers make better-informed financial decisions.",
  },
  {
    question: "What topics does Imperialpedia cover?",
    answer:
      "Imperialpedia publishes original articles across stock market fundamentals (exchanges, indicators, market structure), personal budgeting, fraud and scam protection, and the creator economy (platform payouts, sponsorship rates, and monetization mechanics) — each written and reviewed by named contributors with cited sources.",
  },
  {
    question: "Who writes Imperialpedia's articles?",
    answer:
      "Every article is bylined to a named contributor on our authors page, with many pieces reviewed or fact-checked by a second contributor before publication.",
  },
  {
    question: "Does Imperialpedia offer interactive financial tools?",
    answer:
      "Yes — several creator-economy articles include embedded calculators (RPM/CPM estimation, sponsorship rate benchmarking) that compute results from figures the reader enters, alongside worked examples throughout the articles themselves.",
  },
];

/**
 * Imperialpedia Style Homepage Hero & Intro Section
 */
export function HomeIntro() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
      <div className="max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-[#c8102e] text-white text-xs font-black uppercase tracking-tighter px-3 py-1 -skew-x-12 inline-block shadow-sm">
            IMPERIALPEDIA EDITION
          </span>
          <span className="text-xs font-mono font-black uppercase tracking-widest text-[#c8102e]">
            // FINANCIAL EDUCATION, EXPLAINED CLEARLY
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black dark:text-white tracking-tighter uppercase font-serif leading-none">
          Personal Finance &amp; the Creator Economy — Explained Clearly
        </h1>

        <div className="mt-6 border-l-6 border-[#c8102e] bg-white dark:bg-slate-900 p-6 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)]">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
            Imperialpedia is an independent financial education platform covering personal
            finance, stock market investing fundamentals, and the creator economy. We explain
            complex financial topics clearly, connect related concepts, and provide practical
            tools to help readers make better-informed financial decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
