import React from 'react';
import Link from 'next/link';
import { getCalculatorList } from '@/services/mock-api/calculators';
import { CalculatorCard } from '@/modules/calculators/components/CalculatorCard';
import { Calculator as CalcIcon, Mail, Compass, ArrowRight, TrendingUp, Landmark, PieChart } from 'lucide-react';
import { buildMetadata } from '@/lib/seo';
import { Metadata } from 'next';
import HeadingSection from '@/components/layout/HeadingSection';
import { TrustBar } from '@/components/pages/TrustBar';
import FAQItem from '@/components/faq/FAQItem';
import { env } from '@/config/env';
import {
  financialToolsHubIntro,
  financialToolsCategoryBlurbs,
  financialToolsHubClosing,
  financialToolsHubFAQ,
} from '@/components/financial-tools/hub-content';

export const metadata: Metadata = buildMetadata({
  canonical: '/financial-tools',
  title: 'Financial Calculators | Imperialpedia',
  description: 'Free financial calculators for compound interest, loans, investing, inflation, and trading — each with the formula, a worked example, and plain-language explanation.',
});

/** The three broadly-applicable calculators, spotlighted above the full
 * category grid — an editorial "start here" pick, not a popularity claim. */
const START_HERE_SLUGS = ['compound-interest', 'loan', 'investment'];

/** Slugs that actually have a working page under /financial-tools/[slug].
 * mockCalculators (services/mock-api/calculators.ts) still lists "retirement"
 * and "portfolio" tools with no corresponding route — linking to them 404s.
 * Filtering here keeps the hub honest until those tools ship. */
const LIVE_SLUGS = new Set([
  'compound-interest', 'loan', 'investment', 'inflation',
  'cagr', 'dividend', 'position-size', 'profit-loss',
]);

/** Goal → calculator map. Real editorial content answering the question a
 * reader actually has before they know a calculator's name — every entry
 * points at a real, working tool (see LIVE_SLUGS). */
const CHOOSER: { question: string; slug: string; label: string }[] = [
  { question: 'How much will my savings actually grow over time?', slug: 'compound-interest', label: 'Compound Interest Calculator' },
  { question: 'What will this loan really cost me, total?', slug: 'loan', label: 'Loan Payment Calculator' },
  { question: 'Will my contributions get me to my investing goal?', slug: 'investment', label: 'Investment Growth Calculator' },
  { question: 'What will today\'s money be worth years from now?', slug: 'inflation', label: 'Inflation Calculator' },
  { question: 'Which of two investments actually grew faster?', slug: 'cagr', label: 'CAGR Calculator' },
  { question: 'How much income would this dividend stock generate?', slug: 'dividend', label: 'Dividend Calculator' },
  { question: 'How many shares can I buy without over-risking the trade?', slug: 'position-size', label: 'Position Size Calculator' },
  { question: 'Did I actually profit on that trade, after fees?', slug: 'profit-loss', label: 'Profit/Loss Calculator' },
];

export default async function FinancialToolsDashboard() {
  const response = await getCalculatorList();
  const allTools = response.data;
  const tools = allTools.filter((t) => LIVE_SLUGS.has(t.slug));
  const categories = Array.from(new Set(tools.map((t) => t.category)));
  const startHere = START_HERE_SLUGS.map((slug) => tools.find((t) => t.slug === slug)).filter(
    (t): t is (typeof tools)[number] => Boolean(t)
  );
  const startHereIcons = [TrendingUp, Landmark, PieChart];

  const base = (env.siteUrl || 'https://imperialpedia.com').replace(/\/$/, '');
  const pageUrl = `${base}/financial-tools`;
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Financial Calculators',
    description: 'Free financial calculators for compound interest, loans, investing, inflation, and trading.',
    url: pageUrl,
    isPartOf: { '@type': 'WebSite', name: 'Imperialpedia', url: base },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: tools.map((tool, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tool.name,
        url: `${base}/financial-tools/${tool.slug}`,
      })),
    },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: base },
      { '@type': 'ListItem', position: 2, name: 'Financial Calculators', item: pageUrl },
    ],
  };

  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <HeadingSection
        title="Financial Calculators"
        description="Free tools for the math that actually changes a decision — what compounding does to savings, what a loan really costs, how to size a trade. Every tool below shows its formula and a worked example on its own page, not just an output."
      />
      <TrustBar />

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-16">
        <p className="max-w-3xl text-sm leading-relaxed text-gray-500">
          {financialToolsHubIntro}
        </p>

        {/* Start Here — the three broadly-applicable calculators, spotlighted */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-100">
            Start Here
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {startHere.map((tool, i) => {
              const Icon = startHereIcons[i] ?? CalcIcon;
              return (
                <Link
                  key={tool.id}
                  href={`/financial-tools/${tool.slug}`}
                  className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-6 transition-colors hover:border-gray-900"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {tool.description}
                    </p>
                  </div>
                  <span className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-foreground group-hover:underline">
                    Open calculator
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Which Calculator Should I Use? — a goal-based lookup, not just a category grid */}
        <section>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-100">
            <Compass className="h-4 w-4" />
            Which Calculator Should I Use?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CHOOSER.map((item) => (
              <Link
                key={item.slug}
                href={`/financial-tools/${item.slug}`}
                className="group flex items-center justify-between gap-4 rounded-xl border border-gray-100 px-5 py-4 transition-colors hover:border-gray-900"
              >
                <span className="text-sm text-foreground leading-snug">{item.question}</span>
                <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.label}
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        {categories.map((category) => (
          <section key={category}>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-100">
              <CalcIcon className="h-4 w-4" />
              {category}
            </h2>

            {financialToolsCategoryBlurbs[category] && (
              <p className="max-w-3xl text-sm leading-relaxed text-gray-500 mb-6">
                {financialToolsCategoryBlurbs[category]}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools
                .filter(t => t.category === category)
                .map((tool) => (
                  <CalculatorCard key={tool.id} tool={tool} />
                ))
              }
            </div>
          </section>
        ))}

        <p className="max-w-3xl text-sm leading-relaxed text-gray-500">
          {financialToolsHubClosing}
        </p>

        {/* FAQ — about the calculator library itself, distinct from each tool's own formula FAQ */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-100">
            Frequently Asked Questions
          </h2>
          <div className="rounded-2xl border border-gray-100 px-4">
            {financialToolsHubFAQ.map((f) => (
              <FAQItem key={f.question} question={f.question} answer={f.answer} />
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-2xl bg-gray-50 py-12 text-center px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Need a Calculator We Don't Have Yet?</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            Imperialpedia's calculator library keeps growing. Let us know what you're trying to work out and our editorial team will consider it for a future addition.
          </p>
          <a
            href="mailto:editorial@imperialpedia.com"
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-gray-900"
          >
            Suggest a Calculator
          </a>
        </section>

        {/* Explore More — cross-links into the site's editorial hubs */}
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-6 pb-2 border-b border-gray-100">
            Explore More
          </h2>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {[
              { href: '/personal-finance', label: 'Personal Finance' },
              { href: '/investing', label: 'Investing' },
              { href: '/stocks', label: 'Stocks' },
              { href: '/economy', label: 'Economy' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
