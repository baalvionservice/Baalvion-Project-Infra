import React from "react";

export const homeFaqItems: { question: string; answer: string }[] = [
  {
    question: "What is Imperialpedia?",
    answer:
      "Imperialpedia is an independent financial education and market information platform covering personal finance, investing, financial markets, and economics. It explains complex financial topics clearly, connects related concepts, and provides practical tools to help readers make better-informed financial decisions.",
  },
  {
    question: "What knowledge does Imperialpedia contain?",
    answer:
      "Imperialpedia's knowledge graph covers company profiles (founders, leadership, competitors, industry position), country economic profiles, industry sector data, and technology entities, alongside a financial glossary and a continuously updated library of market and economy articles.",
  },
  {
    question: "What entities can I explore on Imperialpedia?",
    answer:
      "You can explore companies, countries, industries, and technologies as interconnected knowledge nodes, each linked to related entities, live market quotes where applicable, and relevant articles and glossary terms.",
  },
  {
    question: "Is Imperialpedia's market data live?",
    answer:
      "Yes. Market quotes, index levels, and mover rankings on Imperialpedia are sourced from a live market-data pipeline and refreshed on a short interval, rather than fixed at publish time.",
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
            // LIVE FINANCIAL INTELLIGENCE NETWORK
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-black dark:text-white tracking-tighter uppercase font-serif leading-none">
          Financial Knowledge &amp; Markets — Explained Clearly
        </h1>

        <div className="mt-6 border-l-6 border-[#c8102e] bg-white dark:bg-slate-900 p-6 border-3 border-black dark:border-slate-700 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(200,16,46,0.3)]">
          <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed font-sans">
            Imperialpedia is an independent financial education and market information platform
            covering personal finance, investing, financial markets, and economics. We explain
            complex financial topics clearly, connect related concepts, and provide practical
            tools to help readers make better-informed financial decisions.
          </p>
        </div>
      </div>
    </section>
  );
}
