import React from "react";

/**
 * Above-the-fold definitional block answering "What is Imperialpedia?" in
 * plain, extractable sentences. AI answer engines (ChatGPT Search, Perplexity,
 * Google AI Overviews, Bing Copilot, voice assistants) favor content that
 * states the subject, its category, and its scope in a self-contained
 * paragraph rather than requiring inference from navigation or branding —
 * this block exists specifically to be that extractable summary. The
 * matching FAQPage schema (see `homeFaqItems` below) mirrors the same
 * question/answer shape so the structured data and the visible copy agree.
 */
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

export function HomeIntro() {
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10 pb-2">
      <div className="max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
          Financial Knowledge, Markets &amp; Economics — Explained Clearly
        </h1>
        <p className="mt-3 text-base text-muted-foreground leading-relaxed">
          Imperialpedia is an independent financial education and market information platform
          covering personal finance, investing, financial markets, and economics. We explain
          complex financial topics clearly, connect related concepts, and provide practical
          tools to help readers make better-informed financial decisions.
        </p>
      </div>
    </section>
  );
}
